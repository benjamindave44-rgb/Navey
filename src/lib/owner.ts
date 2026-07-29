import { createServerSupabaseClient } from "@/lib/supabase-server";

export type OwnerSpotSummary = {
  id: string;
  name: string;
  city: string;
  status: string;
  needsReview: boolean;
};

export async function getOwnerSpots(userId: string): Promise<OwnerSpotSummary[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("spots")
    .select("id, name, city, status, needs_review")
    .eq("submitted_by", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((spot) => ({
    id: spot.id,
    name: spot.name,
    city: spot.city,
    status: spot.status,
    needsReview: spot.needs_review,
  }));
}

export type OwnerSpotDetail = {
  id: string;
  name: string;
  category: string;
  priceRange: string | null;
  address: string;
  city: string;
  province: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  status: string;
  needsReview: boolean;
  noiseLevel: string | null;
  musicStyle: string | null;
  lighting: string | null;
  seatingStyle: string | null;
  acceptsCash: boolean;
  acceptsQrPh: boolean;
  acceptsCards: boolean;
  acceptsBankTransfer: boolean;
  hours: {
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }[];
  tagIds: number[];
  galleryPhotos: { id: string; url: string }[];
  menuPhotos: { id: string; url: string }[];
};

export async function getOwnerSpotDetail(
  userId: string,
  spotId: string
): Promise<OwnerSpotDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("spots")
    .select(
      `id, name, category, price_range, address, city, province, lat, lng, description, status, needs_review,
       noise_level, music_style, lighting, seating_style,
       accepts_cash, accepts_qr_ph, accepts_cards, accepts_bank_transfer,
       spot_hours(day_of_week, open_time, close_time, is_closed),
       spot_tags(tag_id),
       spot_photos(id, url, kind)`
    )
    .eq("id", spotId)
    .eq("submitted_by", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    category: data.category,
    priceRange: data.price_range,
    address: data.address,
    city: data.city,
    province: data.province,
    lat: data.lat,
    lng: data.lng,
    description: data.description,
    status: data.status,
    needsReview: data.needs_review,
    noiseLevel: data.noise_level,
    musicStyle: data.music_style,
    lighting: data.lighting,
    seatingStyle: data.seating_style,
    acceptsCash: data.accepts_cash,
    acceptsQrPh: data.accepts_qr_ph,
    acceptsCards: data.accepts_cards,
    acceptsBankTransfer: data.accepts_bank_transfer,
    hours: data.spot_hours.map((hour) => ({
      dayOfWeek: hour.day_of_week,
      openTime: hour.open_time,
      closeTime: hour.close_time,
      isClosed: hour.is_closed,
    })),
    tagIds: data.spot_tags.map((tag) => tag.tag_id),
    galleryPhotos: data.spot_photos
      .filter((photo) => photo.kind === "gallery")
      .map((photo) => ({ id: photo.id, url: photo.url })),
    menuPhotos: data.spot_photos
      .filter((photo) => photo.kind === "menu")
      .map((photo) => ({ id: photo.id, url: photo.url })),
  };
}

export type OwnerSpotStats = {
  spotId: string;
  saveCount: number;
  reviewCount: number;
  averageRating: number | null;
  galleryPhotos: number;
  hasHours: boolean;
  hasPin: boolean;
  /** Things an owner can act on, worth more than a number they can't move. */
  missing: string[];
};

export async function getOwnerSpotStats(
  userId: string
): Promise<Map<string, OwnerSpotStats>> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("spots")
    .select(
      "id, save_count, lat, description, reviews(rating), spot_photos(kind), spot_hours(day_of_week), spot_tags(tag_id)"
    )
    .eq("submitted_by", userId);

  const stats = new Map<string, OwnerSpotStats>();

  for (const spot of data ?? []) {
    const ratings = spot.reviews.map((review) => review.rating);
    const gallery = spot.spot_photos.filter((p) => p.kind === "gallery").length;
    const hasHours = spot.spot_hours.length > 0;
    const hasPin = spot.lat !== null;

    const missing: string[] = [];
    if (gallery === 0) missing.push("photos");
    if (!hasHours) missing.push("opening hours");
    if (spot.spot_tags.length === 0) missing.push("tags");
    if (!spot.description) missing.push("a description");
    if (!hasPin) missing.push("a map pin");

    stats.set(spot.id, {
      spotId: spot.id,
      saveCount: spot.save_count,
      reviewCount: ratings.length,
      averageRating: ratings.length
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null,
      galleryPhotos: gallery,
      hasHours,
      hasPin,
      missing,
    });
  }

  return stats;
}
