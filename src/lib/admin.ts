import { createServerSupabaseClient } from "@/lib/supabase-server";

export type PendingSpot = {
  id: string;
  name: string;
  category: string;
  city: string;
  province: string | null;
  address: string;
  priceRange: string | null;
  description: string | null;
  createdAt: string;
  submitterName: string | null;
};

export async function getPendingSpots(): Promise<PendingSpot[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("spots")
    .select(
      "id, name, category, city, province, address, price_range, description, created_at, submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((spot) => ({
    id: spot.id,
    name: spot.name,
    category: spot.category,
    city: spot.city,
    province: spot.province,
    address: spot.address,
    priceRange: spot.price_range,
    description: spot.description,
    createdAt: spot.created_at,
    submitterName: spot.submitted_by_profile?.display_name ?? null,
  }));
}

export type FlaggedSpot = {
  id: string;
  name: string;
  city: string;
  description: string | null;
  submitterName: string | null;
};

export async function getFlaggedSpots(): Promise<FlaggedSpot[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("spots")
    .select(
      "id, name, city, description, submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)"
    )
    .eq("needs_review", true)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((spot) => ({
    id: spot.id,
    name: spot.name,
    city: spot.city,
    description: spot.description,
    submitterName: spot.submitted_by_profile?.display_name ?? null,
  }));
}
