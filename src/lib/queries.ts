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
  tags: string[];
};

export type SpotFilters = {
  search?: string;
  category?: string;
  city?: string;
  tag?: string;
  limit?: number;
};

export async function getApprovedSpots(
  filters: SpotFilters = {}
): Promise<SpotWithTags[]> {
  const { search, category, city, tag, limit } = filters;

  let query = supabase
    .from("spots")
    .select(
      "id, name, category, price_range, city, province, hidden_gem, description, spot_tags(tags(label))"
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

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
    tags: spot.spot_tags
      .map((st) => st.tags?.label)
      .filter((label): label is string => Boolean(label)),
  }));

  if (tag) {
    spots = spots.filter((spot) => spot.tags.includes(tag));
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

export type SpotReview = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  author: string;
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
  accepts_cash: boolean;
  accepts_qr_ph: boolean;
  accepts_cards: boolean;
  accepts_bank_transfer: boolean;
  photos: { id: string; url: string; kind: string }[];
  hours: {
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }[];
  reviews: SpotReview[];
  averageRating: number | null;
};

export async function getSpotDetail(id: string): Promise<SpotDetail | null> {
  const { data, error } = await supabase
    .from("spots")
    .select(
      `id, name, category, price_range, city, province, address, lat, lng,
       description, hidden_gem, pwd_friendly,
       noise_level, music_style, lighting, seating_style,
       accepts_cash, accepts_qr_ph, accepts_cards, accepts_bank_transfer,
       spot_tags(tags(label)),
       spot_photos(id, url, kind),
       spot_hours(day_of_week, open_time, close_time, is_closed),
       reviews(id, rating, body, created_at, profiles(display_name))`
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
    accepts_cash: data.accepts_cash,
    accepts_qr_ph: data.accepts_qr_ph,
    accepts_cards: data.accepts_cards,
    accepts_bank_transfer: data.accepts_bank_transfer,
    photos: data.spot_photos,
    hours: [...data.spot_hours].sort((a, b) => a.day_of_week - b.day_of_week),
    reviews,
    averageRating,
  };
}
