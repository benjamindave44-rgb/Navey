import { supabase } from "@/lib/supabase";

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
      "id, name, category, price_range, city, province, hidden_gem, description, save_count, spot_tags(tags(label))"
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
  if (error || !data) return [];

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
    tags: spot.spot_tags
      .map((st) => st.tags?.label)
      .filter((label): label is string => Boolean(label)),
  }));

  if (tagList.length > 0) {
    spots = spots.filter((spot) => tagList.every((t) => spot.tags.includes(t)));
  }

  return typeof limit === "number" ? spots.slice(0, limit) : spots;
}

export async function getCities(): Promise<string[]> {
  const { data, error } = await supabase
    .from("spots")
    .select("city")
    .eq("status", "approved");

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
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((collection) => ({
    id: collection.id,
    title: collection.title,
    description: collection.description,
    spotCount: collection.collection_spots.length,
  }));
}

export async function getTags() {
  const { data, error } = await supabase
    .from("tags")
    .select("id, label, icon")
    .order("id");

  if (error || !data) return [];
  return data;
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
       collection_spots(rank, spots(id, name, category, price_range, city, province, hidden_gem, description, save_count, spot_tags(tags(label))))`
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

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
        tags: spot.spot_tags
          .map((st) => st.tags?.label)
          .filter((label): label is string => Boolean(label)),
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
  }[];
  reviews: SpotReview[];
  averageRating: number | null;
  contributor: { name: string } | null;
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
       spot_hours(day_of_week, open_time, close_time, is_closed),
       reviews(id, rating, body, created_at, profiles(display_name), review_photos(url)),
       submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)`
    )
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !data) return null;

  const reviews: SpotReview[] = data.reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    body: review.body,
    created_at: review.created_at,
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
    hidden_gem: data.hidden_gem,
    description: data.description,
    tags: data.spot_tags
      .map((st) => st.tags?.label)
      .filter((label): label is string => Boolean(label)),
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
    contributor: data.submitted_by_profile?.display_name
      ? { name: data.submitted_by_profile.display_name }
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
