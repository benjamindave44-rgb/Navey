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
      `id, name, category, price_range, address, city, province, description, status, needs_review,
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
    menuPhotos: data.spot_photos
      .filter((photo) => photo.kind === "menu")
      .map((photo) => ({ id: photo.id, url: photo.url })),
  };
}
