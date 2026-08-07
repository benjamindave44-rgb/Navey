import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { orderTagsForCards } from "@/lib/tag-priority";
import { openStatus, type OpenState } from "@/lib/open-status";

/**
 * A query that fails is not a query that found nothing, and the two must not
 * look the same. Silently returning an empty result hides real breakage --
 * a schema change the API layer hasn't picked up yet turns every listing
 * page into "no spots yet" with nothing in the logs to explain it.
 */
function logQueryError(where: string, error: PostgrestError | null) {
  if (error) console.error(`[queries] ${where} failed:`, error.message, error.code);
}

export type SpotWithTags = {
  id: string;
  name: string;
  category: string;
  price_range: string | null;
  city: string;
  province: string | null;
  hidden_gem: boolean;
  description: string | null;
  saveCount: number;
  tags: string[];
  coverPhoto: string | null;
  /** Worked out at request time in Manila. "unknown" when the hours are
   *  missing or unreadable, so the card can show no badge at all. */
  openState: OpenState;
};

export type SpotSort = "recommended" | "newest" | "most_saved";

export type SpotFilters = {
  search?: string;
  category?: string;
  city?: string;
  tag?: string;
  tags?: string[];
  sort?: SpotSort;
  limit?: number;
};

export async function getApprovedSpots(
  filters: SpotFilters = {}
): Promise<SpotWithTags[]> {
  const { search, category, city, tag, tags, sort, limit } = filters;
  const tagList = tags && tags.length > 0 ? tags : tag ? [tag] : [];

  let query = supabase
    .from("spots")
    .select(
      "id, name, category, price_range, city, province, hidden_gem, description, save_count, spot_tags(tags(label, tag_group, sort_order)), spot_photos(url, kind), spot_hours(day_of_week, open_time, close_time, is_closed, is_24_hours)"
    )
    .eq("status", "approved");

  if (sort === "most_saved") {
    query = query.order("save_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `name.ilike.${term},city.ilike.${term},description.ilike.${term}`
    );
  }
  if (category) query = query.eq("category", category);
  if (city) query = query.eq("city", city);

  const { data, error } = await query;
  logQueryError("getApprovedSpots", error);
  if (error || !data) return [];

  // One timestamp for the whole grid: computing per card could straddle a
  // minute boundary and show two spots with identical hours differently.
  const now = new Date();

  let spots = data.map((spot) => ({
    id: spot.id,
    name: spot.name,
    category: spot.category,
    price_range: spot.price_range,
    city: spot.city,
    province: spot.province,
    hidden_gem: spot.hidden_gem,
    description: spot.description,
    saveCount: spot.save_count,
    tags: orderTagsForCards(
      spot.spot_tags
        .map((st) => st.tags)
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
        .map((tag) => ({
          label: tag.label,
          group: tag.tag_group,
          sort: tag.sort_order,
        }))
    ),
    coverPhoto: spot.spot_photos.find((p) => p.kind === "gallery")?.url ?? null,
    openState: openStatus(spot.spot_hours, now),
  }));

  if (tagList.length > 0) {
    spots = spots.filter((spot) => tagList.every((t) => spot.tags.includes(t)));
  }

  return typeof limit === "number" ? spots.slice(0, limit) : spots;
}

/**
 * Admin-curated homepage picks. Falls back to hidden gems and then the
 * newest spots so the hero is never empty before anything is featured.
 */
export async function getFeaturedSpots(limit = 5): Promise<SpotWithTags[]> {
  const { data } = await supabase
    .from("spots")
    .select(
      "id, name, category, price_range, city, province, hidden_gem, description, save_count, spot_tags(tags(label, tag_group, sort_order)), spot_photos(url, kind), spot_hours(day_of_week, open_time, close_time, is_closed, is_24_hours)"
    )
    .eq("status", "approved")
    .eq("featured", true)
    .order("featured_rank", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  const now = new Date();
  const featured = (data ?? []).map((spot) => ({
    id: spot.id,
    name: spot.name,
    category: spot.category,
    price_range: spot.price_range,
    city: spot.city,
    province: spot.province,
    hidden_gem: spot.hidden_gem,
    description: spot.description,
    saveCount: spot.save_count,
    tags: orderTagsForCards(
      spot.spot_tags
        .map((st) => st.tags)
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
        .map((tag) => ({
          label: tag.label,
          group: tag.tag_group,
          sort: tag.sort_order,
        }))
    ),
    coverPhoto: spot.spot_photos.find((p) => p.kind === "gallery")?.url ?? null,
    openState: openStatus(spot.spot_hours, now),
  }));

  if (featured.length > 0) return featured;

  const fallback = await getApprovedSpots({ limit });
  const gems = fallback.filter((spot) => spot.hidden_gem);
  return (gems.length > 0 ? gems : fallback).slice(0, limit);
}

export type MapSpot = {
  id: string;
  name: string;
  category: string;
  city: string;
  priceRange: string | null;
  lat: number;
  lng: number;
  coverPhoto: string | null;
};

export async function getMapSpots(): Promise<MapSpot[]> {
  const { data, error } = await supabase
    .from("spots")
    .select("id, name, category, city, price_range, lat, lng, spot_photos(url, kind)")
    .eq("status", "approved")
    .not("lat", "is", null)
    .not("lng", "is", null);

  logQueryError("getMapSpots", error);
  if (error || !data) return [];

  return data
    .filter((spot): spot is typeof spot & { lat: number; lng: number } =>
      spot.lat !== null && spot.lng !== null
    )
    .map((spot) => ({
      id: spot.id,
      name: spot.name,
      category: spot.category,
      city: spot.city,
      priceRange: spot.price_range,
      lat: spot.lat,
      lng: spot.lng,
      coverPhoto: spot.spot_photos.find((p) => p.kind === "gallery")?.url ?? null,
    }));
}

/**
 * Scores approved spots by how many of the given tag labels they match
 * and returns the top matches. Falls back to the most-saved spots when
 * no tags are given (e.g. the user picked "no preference" throughout).
 */
export async function getVibeMatches(
  tagLabels: string[],
  limit = 3
): Promise<SpotWithTags[]> {
  const spots = await getApprovedSpots({});
  const scored = spots.map((spot) => ({
    spot,
    score: tagLabels.filter((tag) => spot.tags.includes(tag)).length,
  }));
  scored.sort((a, b) => b.score - a.score || b.spot.saveCount - a.spot.saveCount);
  return scored.slice(0, limit).map((entry) => entry.spot);
}

export async function getCities(): Promise<string[]> {
  const { data, error } = await supabase
    .from("spots")
    .select("city")
    .eq("status", "approved");

  logQueryError("getCities", error);
  if (error || !data) return [];
  return Array.from(new Set(data.map((spot) => spot.city))).sort();
}

export type CollectionWithSpots = {
  id: string;
  title: string;
  description: string | null;
  spotCount: number;
};

export async function getCollections(limit = 4): Promise<CollectionWithSpots[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("id, title, description, collection_spots(spot_id)")
    .order("created_at", { ascending: false });

  logQueryError("getCollections", error);
  if (error || !data) return [];

  // A collection empties itself whenever its spots are removed, and a card
  // advertising "0 spots" is worse than no card. Filtered after fetching
  // rather than limited in the query, so an empty one does not take a slot
  // from a collection that has something in it. Admin has its own query and
  // still sees every collection.
  return data
    .map((collection) => ({
      id: collection.id,
      title: collection.title,
      description: collection.description,
      spotCount: collection.collection_spots.length,
    }))
    .filter((collection) => collection.spotCount > 0)
    .slice(0, limit);
}

export type Tag = {
  id: number;
  label: string;
  icon: string | null;
  group: string;
  /** How many approved listings carry it. Zero means it is real but not yet
   *  earned -- offer it when tagging, hide it when browsing. */
  count: number;
};

/** Ordered by sort_order so groups arrive together and in a deliberate
 *  sequence, rather than in whatever order the rows were created. */
export async function getTags(): Promise<Tag[]> {
  const [{ data, error }, { data: used }] = await Promise.all([
    supabase
      .from("tags")
      .select("id, label, icon, tag_group, sort_order")
      .order("sort_order"),
    supabase.from("spot_tags").select("tag_id, spots!inner(status)"),
  ]);

  const counts = new Map<number, number>();
  for (const row of used ?? []) {
    if (row.spots?.status !== "approved") continue;
    counts.set(row.tag_id, (counts.get(row.tag_id) ?? 0) + 1);
  }

  logQueryError("getTags", error);
  if (error || !data) return [];
  return data.map((tag) => ({
    id: tag.id,
    label: tag.label,
    icon: tag.icon,
    group: tag.tag_group,
    count: counts.get(tag.id) ?? 0,
  }));
}

/**
 * Only the tags that lead somewhere. A browse chip promising "Unlimited
 * Chicken" and landing on an empty page reads as a broken site, not as an
 * empty category -- so the public surfaces filter, while the pickers keep
 * offering everything so the tags can be earned in the first place.
 */
export function tagsInUse(tags: Tag[]): Tag[] {
  return tags.filter((tag) => tag.count > 0);
}

export type CollectionSpot = SpotWithTags & { rank: number };

export type CollectionDetail = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  curatorName: string | null;
  coverPhotos: { id: string; url: string }[];
  spots: CollectionSpot[];
};

export async function getCollectionDetail(
  id: string,
  sort: "recommended" | "most_saved" = "recommended"
): Promise<CollectionDetail | null> {
  const { data, error } = await supabase
    .from("collections")
    .select(
      `id, title, description, created_at,
       curator:profiles(display_name),
       collection_photos(id, url),
       collection_spots(rank, spots(id, name, category, price_range, city, province, hidden_gem, description, save_count, spot_tags(tags(label, tag_group, sort_order)), spot_photos(url, kind), spot_hours(day_of_week, open_time, close_time, is_closed, is_24_hours)))`
    )
    .eq("id", id)
    .maybeSingle();

  logQueryError("getCollectionDetail", error);
  if (error || !data) return null;

  const now = new Date();
  let spots: CollectionSpot[] = data.collection_spots
    .filter((entry) => entry.spots)
    .map((entry) => {
      const spot = entry.spots!;
      return {
        id: spot.id,
        name: spot.name,
        category: spot.category,
        price_range: spot.price_range,
        city: spot.city,
        province: spot.province,
        hidden_gem: spot.hidden_gem,
        description: spot.description,
        saveCount: spot.save_count,
        tags: orderTagsForCards(
          spot.spot_tags
            .map((st) => st.tags)
            .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
            .map((tag) => ({
              label: tag.label,
              group: tag.tag_group,
              sort: tag.sort_order,
            }))
        ),
        coverPhoto: spot.spot_photos.find((p) => p.kind === "gallery")?.url ?? null,
        openState: openStatus(spot.spot_hours, now),
        rank: entry.rank,
      };
    });

  spots =
    sort === "most_saved"
      ? [...spots].sort((a, b) => b.saveCount - a.saveCount)
      : [...spots].sort((a, b) => a.rank - b.rank);

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    createdAt: data.created_at,
    curatorName: data.curator?.display_name ?? null,
    coverPhotos: data.collection_photos,
    spots,
  };
}

export async function getOtherCollections(
  excludeId: string,
  limit = 4
): Promise<CollectionWithSpots[]> {
  const all = await getCollections(limit + 1);
  return all.filter((collection) => collection.id !== excludeId).slice(0, limit);
}

export type SpotReview = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  authorId: string | null;
  author: string;
  photos: string[];
};

export type SpotDetail = SpotWithTags & {
  address: string;
  lat: number | null;
  lng: number | null;
  noise_level: string | null;
  music_style: string | null;
  lighting: string | null;
  seating_style: string | null;
  pwd_friendly: boolean;
  saveCount: number;
  accepts_cash: boolean;
  accepts_qr_ph: boolean;
  accepts_cards: boolean;
  accepts_bank_transfer: boolean;
  galleryPhotos: { id: string; url: string }[];
  menuPhotos: { id: string; url: string }[];
  hours: {
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
    is_24_hours: boolean;
  }[];
  reviews: SpotReview[];
  averageRating: number | null;
  contributor: { id: string; name: string } | null;
};

export async function getSpotDetail(id: string): Promise<SpotDetail | null> {
  const { data, error } = await supabase
    .from("spots")
    .select(
      `id, name, category, price_range, city, province, address, lat, lng,
       description, hidden_gem, pwd_friendly, save_count,
       noise_level, music_style, lighting, seating_style,
       accepts_cash, accepts_qr_ph, accepts_cards, accepts_bank_transfer,
       spot_tags(tags(label)),
       spot_photos(id, url, kind),
       spot_hours(day_of_week, open_time, close_time, is_closed, is_24_hours),
       reviews(id, rating, body, created_at, user_id, profiles!reviews_user_id_fkey(display_name), review_photos(url)),
       submitted_by, submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)`
    )
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  // A broken query must not be reported as a missing spot. Returning null here
  // makes the page 404, which tells visitors the shop was removed and tells
  // Google to drop it from the index -- over what may be a passing fault.
  // Throwing surfaces the real error page instead, and leaves the listing
  // indexed once the fault clears.
  if (error) {
    logQueryError(`getSpotDetail(${id})`, error);
    throw new Error(`Could not load spot ${id}: ${error.message}`);
  }
  if (!data) return null;

  const reviews: SpotReview[] = data.reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    body: review.body,
    created_at: review.created_at,
    authorId: review.user_id,
    author: review.profiles?.display_name ?? "Anonymous",
    photos: review.review_photos.map((photo) => photo.url),
  }));

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  return {
    id: data.id,
    name: data.name,
    category: data.category,
    price_range: data.price_range,
    city: data.city,
    province: data.province,
    openState: openStatus(data.spot_hours),
    hidden_gem: data.hidden_gem,
    description: data.description,
    tags: data.spot_tags
      .map((st) => st.tags?.label)
      .filter((label): label is string => Boolean(label)),
    coverPhoto:
      data.spot_photos.find((p) => p.kind === "gallery")?.url ?? null,
    address: data.address,
    lat: data.lat,
    lng: data.lng,
    noise_level: data.noise_level,
    music_style: data.music_style,
    lighting: data.lighting,
    seating_style: data.seating_style,
    pwd_friendly: data.pwd_friendly,
    saveCount: data.save_count,
    accepts_cash: data.accepts_cash,
    accepts_qr_ph: data.accepts_qr_ph,
    accepts_cards: data.accepts_cards,
    accepts_bank_transfer: data.accepts_bank_transfer,
    galleryPhotos: data.spot_photos.filter((p) => p.kind === "gallery"),
    menuPhotos: data.spot_photos.filter((p) => p.kind === "menu"),
    hours: [...data.spot_hours].sort((a, b) => a.day_of_week - b.day_of_week),
    reviews,
    averageRating,
    contributor:
      data.submitted_by && data.submitted_by_profile?.display_name
        ? { id: data.submitted_by, name: data.submitted_by_profile.display_name }
        : null,
  };
}

export async function getRelatedSpots(
  excludeId: string,
  city: string,
  limit = 4
): Promise<SpotWithTags[]> {
  const sameCity = await getApprovedSpots({ city, limit: limit + 1 });
  const filtered = sameCity.filter((spot) => spot.id !== excludeId);
  if (filtered.length >= limit) return filtered.slice(0, limit);

  const rest = await getApprovedSpots({ limit: limit + 1 });
  const combined = [...filtered];
  for (const spot of rest) {
    if (combined.length >= limit) break;
    if (spot.id === excludeId) continue;
    if (combined.some((existing) => existing.id === spot.id)) continue;
    combined.push(spot);
  }
  return combined.slice(0, limit);
}
