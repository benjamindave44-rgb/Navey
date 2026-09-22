import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { orderTagsForCards } from "@/lib/tag-priority";
import {
  openStatus,
  type OpenHourRow,
  type OpenState,
} from "@/lib/open-status";
import { memo } from "@/lib/memo";
import type { AmenitySource } from "@/lib/amenities";

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
  /**
   * Worked out when this page was built, which on a page cached for a week is
   * not the same thing as now. Kept only so the badge has something to draw on
   * the first paint; OpenBadge recalculates it in the browser and that is the
   * value a visitor actually sees. "unknown" means the hours are missing or
   * unreadable, and the badge stays hidden.
   */
  openState: OpenState;
  /**
   * The opening hours themselves, carried to the browser so the badge can be
   * worked out against the visitor's own clock rather than the build's.
   *
   * This is the fix for a bug the caching work introduced: with `revalidate`
   * at a week, an "Open now" badge computed on the server could be six days
   * stale -- confidently telling somebody a shop is open on a Tuesday because
   * it was open when the page was built on a Wednesday. Seven small rows per
   * card is a few hundred bytes; a wrong badge on a directory is the whole
   * product.
   */
  hours: OpenHourRow[];
  /**
   * The practical facts, in the one shape src/lib/amenities.ts knows how to
   * turn into words. Every field is optional: a card fetches only the three it
   * has room for, a listing page fetches all six, and both can be handed
   * straight to workChips and comfortChips without either caller reshaping
   * anything.
   */
  amenities: AmenitySource;
  /** For the "just added" row. ISO timestamp, as stored. */
  createdAt: string;
};

export type SpotSort = "recommended" | "newest" | "most_saved";

export type SpotFilters = {
  search?: string;
  category?: string;
  city?: string;
  district?: string;
  tag?: string;
  tags?: string[];
  /** "P", "PP", "PPP" -- matched exactly, as stored on the listing. */
  price?: string;
  /** Only places open at the moment of the request, worked out in Manila. */
  openNow?: boolean;
  /**
   * "Somewhere I can work" -- good wifi, and at least a few outlets.
   *
   * One filter rather than three, because nobody wants to tick three boxes to
   * ask one question. Good wifi only: patchy wifi is not somewhere you take a
   * day's work. Listings nobody has checked are excluded, on the same principle
   * as openNow -- an empty column is not a promise.
   */
  workFriendly?: boolean;
  /** Aircon confirmed present. A genuinely Philippine filter. */
  aircon?: boolean;
  sort?: SpotSort;
  limit?: number;
};

/** Any Supabase client. Passed in rather than reached for, so a caller can
 *  hand over the signed-in person's own client and let the database's rules
 *  decide what comes back. */
type SupabaseLike = SupabaseClient<Database>;

/** Everything a card needs, in one place. This was written out at each call
 *  site, which is how two of them can quietly drift apart and one grid starts
 *  rendering without hours or tags. */
const SPOT_CARD_SELECT =
  "id, name, category, price_range, city, province, hidden_gem, description, save_count, created_at, wifi, power_outlets, has_aircon, spot_tags(tags(label, tag_group, sort_order)), spot_photos(url, kind), spot_hours(day_of_week, open_time, close_time, is_closed, is_24_hours)";

/** The shape SPOT_CARD_SELECT comes back as. Written out so the mapper below
 *  can be shared without each caller having to name its own row type. */
type SpotCardRow = {
  id: string;
  name: string;
  category: string;
  price_range: string | null;
  city: string;
  province: string | null;
  hidden_gem: boolean;
  description: string | null;
  save_count: number;
  created_at: string;
  wifi: string | null;
  power_outlets: string | null;
  has_aircon: boolean | null;
  spot_tags: { tags: { label: string; tag_group: string; sort_order: number } | null }[];
  spot_photos: { url: string; kind: string }[];
  spot_hours: OpenHourRow[];
};

/**
 * One row to one card.
 *
 * The select string was already shared, with a comment explaining that writing
 * it out per call site is how two of them drift apart -- but the mapping that
 * followed it was still copied out four times, in getApprovedSpots,
 * getFeaturedSpots, getSpotsByIds and getCollectionDetail. Adding a field meant
 * remembering all four, which is the same trap one layer up.
 */
function toSpotCard(row: SpotCardRow, now: Date): SpotWithTags {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price_range: row.price_range,
    city: row.city,
    province: row.province,
    hidden_gem: row.hidden_gem,
    description: row.description,
    saveCount: row.save_count,
    tags: orderTagsForCards(
      row.spot_tags
        .map((st) => st.tags)
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
        .map((tag) => ({
          label: tag.label,
          group: tag.tag_group,
          sort: tag.sort_order,
        }))
    ),
    coverPhoto: row.spot_photos.find((p) => p.kind === "gallery")?.url ?? null,
    openState: openStatus(row.spot_hours, now),
    hours: row.spot_hours,
    amenities: {
      wifi: row.wifi,
      power_outlets: row.power_outlets,
      has_aircon: row.has_aircon,
    },
    createdAt: row.created_at,
  };
}

export async function getApprovedSpots(
  filters: SpotFilters = {}
): Promise<SpotWithTags[]> {
  const {
    search,
    category,
    city,
    district,
    tag,
    tags,
    price,
    openNow,
    workFriendly,
    aircon,
    sort,
    limit,
  } = filters;
  const tagList = tags && tags.length > 0 ? tags : tag ? [tag] : [];

  let query = supabase
    .from("spots")
    .select(
      SPOT_CARD_SELECT
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
  if (district) query = query.eq("district", district);
  if (price) query = query.eq("price_range", price);
  // Done in SQL rather than after the fetch, unlike openNow: these are plain
  // column comparisons with no clock or timezone involved, and the partial
  // index in migration 0039 covers exactly this pair.
  if (workFriendly) {
    query = query.eq("wifi", "good").in("power_outlets", ["few", "plenty"]);
  }
  if (aircon) query = query.eq("has_aircon", true);

  const { data, error } = await query;
  logQueryError("getApprovedSpots", error);
  if (error || !data) return [];

  // One timestamp for the whole grid: computing per card could straddle a
  // minute boundary and show two spots with identical hours differently.
  const now = new Date();

  let spots = data.map((spot) => toSpotCard(spot, now));

  if (tagList.length > 0) {
    spots = spots.filter((spot) => tagList.every((t) => spot.tags.includes(t)));
  }

  // Filtered here rather than in SQL: opening hours wrap past midnight and are
  // read against Manila's clock, and that rule is already written and tested
  // once in openStatus. "unknown" is excluded -- a listing with no readable
  // hours is not a promise that it is open.
  if (openNow) {
    spots = spots.filter((spot) => spot.openState === "open");
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
      SPOT_CARD_SELECT
    )
    .eq("status", "approved")
    .eq("featured", true)
    .order("featured_rank", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  const now = new Date();
  const featured = (data ?? []).map((spot) => toSpotCard(spot, now));

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
  return memo("cities", async () => {
    const { data, error } = await supabase
      .from("spots")
      .select("city")
      .eq("status", "approved");

    logQueryError("getCities", error);
    if (error || !data) return [];
    return Array.from(new Set(data.map((spot) => spot.city))).sort();
  });
}

export type CollectionWithSpots = {
  id: string;
  title: string;
  description: string | null;
  spotCount: number;
  /** What the card shows. The curator's own uploaded cover if there is one,
   *  otherwise the photos of the places inside it. */
  covers: string[];
};

export async function getCollections(limit = 4): Promise<CollectionWithSpots[]> {
  const { data, error } = await supabase
    .from("collections")
    .select(
      "id, title, description, collection_photos(url), collection_spots(spot_id, spots(spot_photos(url, kind)))"
    )
    .order("created_at", { ascending: false });

  logQueryError("getCollections", error);
  if (error || !data) return [];

  // A collection empties itself whenever its spots are removed, and a card
  // advertising "0 spots" is worse than no card. Filtered after fetching
  // rather than limited in the query, so an empty one does not take a slot
  // from a collection that has something in it. Admin has its own query and
  // still sees every collection.
  return data
    .map((collection) => {
      // A curator who uploaded a cover chose it on purpose, so it wins over
      // anything assembled automatically.
      const uploaded = collection.collection_photos[0]?.url;
      const fromSpots = collection.collection_spots
        .map(
          (entry) =>
            entry.spots?.spot_photos.find((photo) => photo.kind === "gallery")
              ?.url ?? null
        )
        .filter((url): url is string => Boolean(url))
        .slice(0, 4);

      return {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        spotCount: collection.collection_spots.length,
        covers: uploaded ? [uploaded] : fromSpots,
      };
    })
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
  return memo("tags", async () => {
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
  });
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
       collection_spots(rank, spots(${SPOT_CARD_SELECT}))`
    )
    .eq("id", id)
    .maybeSingle();

  logQueryError("getCollectionDetail", error);
  if (error || !data) return null;

  const now = new Date();
  let spots: CollectionSpot[] = data.collection_spots
    .filter((entry) => entry.spots)
    .map((entry) => ({
      ...toSpotCard(entry.spots!, now),
      rank: entry.rank,
    }));

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
  reviews: SpotReview[];
  averageRating: number | null;
  contributor: { id: string; name: string } | null;
  instagram: string | null;
  phone: string | null;
  website: string | null;
  /** Date, as stored -- rendered in Manila, never as a raw timestamp. */
  detailsCheckedAt: string | null;
  /** "Latte ₱170", in the order the admin arranged them. */
  priceAnchors: { item: string; pricePhp: number }[];
  /** Tally per label. Built when the page was, so it lags by up to a week on a
   *  cached page -- acceptable for a mood signal, and the tap itself shows
   *  immediately in the browser. */
  reactionCounts: Record<string, number>;
};

/**
 * The tally behind the one-tap reactions.
 *
 * A separate round trip rather than an embed on the listing query, because
 * embedding requires PostgREST to work out a relationship between `spots` and
 * a view, and that inference is not something to bet a page on. One extra read
 * on a page rebuilt weekly is nothing; a listing page that throws because the
 * embed could not be resolved is everything.
 *
 * An empty tally on failure is the right answer: no numbers is a fine way to
 * render a board nobody has voted on, and the buttons still work.
 */
async function getReactionCounts(spotId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("spot_reaction_counts")
    .select("label, total")
    .eq("spot_id", spotId);

  logQueryError(`getReactionCounts(${spotId})`, error);
  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.label && typeof row.total === "number") counts[row.label] = row.total;
  }
  return counts;
}

export async function getSpotDetail(id: string): Promise<SpotDetail | null> {
  const { data, error } = await supabase
    .from("spots")
    .select(
      `id, name, category, price_range, city, province, address, lat, lng,
       description, hidden_gem, pwd_friendly, save_count, created_at,
       noise_level, music_style, lighting, seating_style,
       accepts_cash, accepts_qr_ph, accepts_cards, accepts_bank_transfer,
       wifi, power_outlets, laptop_friendly, has_aircon, has_outdoor_seating,
       parking, instagram, phone, website, details_checked_at,
       spot_tags(tags(label)),
       spot_photos(id, url, kind),
       spot_hours(day_of_week, open_time, close_time, is_closed, is_24_hours),
       spot_price_anchors(item, price_php, sort_order),
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

  const reactionCounts = await getReactionCounts(data.id);

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
    createdAt: data.created_at,
    amenities: {
      wifi: data.wifi,
      power_outlets: data.power_outlets,
      laptop_friendly: data.laptop_friendly,
      has_aircon: data.has_aircon,
      has_outdoor_seating: data.has_outdoor_seating,
      parking: data.parking,
    },
    instagram: data.instagram,
    phone: data.phone,
    website: data.website,
    detailsCheckedAt: data.details_checked_at,
    // Ordered here rather than in the query: the sort column is fetched
    // alongside the rows, and a nested embed's order is not something to rely
    // on.
    priceAnchors: [...data.spot_price_anchors]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((anchor) => ({ item: anchor.item, pricePhp: anchor.price_php })),
    reactionCounts,
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

/**
 * The spots on a saved list. Reads through the caller's own Supabase client so
 * the database decides what may be seen -- a private list returns nothing to
 * anyone but its owner, and that rule lives in one place rather than being
 * re-implemented here.
 */
export async function getSpotsByIds(
  client: SupabaseLike,
  ids: string[]
): Promise<SpotWithTags[]> {
  if (ids.length === 0) return [];

  const { data, error } = await client
    .from("spots")
    .select(SPOT_CARD_SELECT)
    .eq("status", "approved")
    .in("id", ids);

  logQueryError("getSpotsByIds", error);
  if (error || !data) return [];

  const now = new Date();
  const byId = new Map(data.map((spot) => [spot.id, spot]));

  // Kept in the order the ids arrived, so a list reads the way it was built
  // rather than in whatever order the database happened to return.
  return ids.flatMap((id) => {
    const spot = byId.get(id);
    return spot ? [toSpotCard(spot, now)] : [];
  });
}

/**
 * How many listings are live. A count query rather than a fetch: nothing here
 * needs the rows, and pulling all of them to call .length on the result is how
 * a number in a caption quietly becomes the most expensive thing on a page.
 * Memoised with the other reference values, since it changes about as often.
 */
export async function countApprovedSpots(): Promise<number> {
  return memo("approved-count", async () => {
    const { count, error } = await supabase
      .from("spots")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");

    logQueryError("countApprovedSpots", error);
    return count ?? 0;
  });
}

/**
 * Just the ids of live listings, for the build's page lists.
 *
 * generateStaticParams only needs a column of ids, and calling
 * getApprovedSpots for it pulled the whole catalogue -- tags, photos and
 * opening hours included -- for every route that wanted the list.
 */
export async function getApprovedSpotIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("spots")
    .select("id")
    .eq("status", "approved");

  logQueryError("getApprovedSpotIds", error);
  return (data ?? []).map((spot) => spot.id);
}
