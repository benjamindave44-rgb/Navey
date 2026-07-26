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

export type PendingClaim = {
  id: string;
  spotId: string;
  spotName: string;
  spotCity: string;
  claimantName: string;
  claimantEmail: string;
  createdAt: string;
  proofUrl: string | null;
};

export async function getPendingClaims(): Promise<PendingClaim[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("business_claims")
    .select(
      "id, spot_id, claimant_name, claimant_email, proof_path, created_at, spots(name, city)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return Promise.all(
    data.map(async (claim) => {
      let proofUrl: string | null = null;
      if (claim.proof_path) {
        const { data: signed } = await supabase.storage
          .from("claim-proofs")
          .createSignedUrl(claim.proof_path, 60 * 10);
        proofUrl = signed?.signedUrl ?? null;
      }

      return {
        id: claim.id,
        spotId: claim.spot_id,
        spotName: claim.spots?.name ?? "Unknown spot",
        spotCity: claim.spots?.city ?? "",
        claimantName: claim.claimant_name,
        claimantEmail: claim.claimant_email,
        createdAt: claim.created_at,
        proofUrl,
      };
    })
  );
}

export async function getPendingClaimsCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("business_claims")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

export type AdminSpotListItem = {
  id: string;
  name: string;
  city: string;
  category: string;
  status: string;
  needsReview: boolean;
  createdAt: string;
};

export async function getAdminSpotList(filters: {
  search?: string;
  status?: string;
}): Promise<AdminSpotListItem[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("spots")
    .select("id, name, city, category, status, needs_review, created_at")
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`name.ilike.${term},city.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((spot) => ({
    id: spot.id,
    name: spot.name,
    city: spot.city,
    category: spot.category,
    status: spot.status,
    needsReview: spot.needs_review,
    createdAt: spot.created_at,
  }));
}

export type AdminSpotDetail = {
  id: string;
  name: string;
  category: string;
  priceRange: string | null;
  address: string;
  city: string;
  province: string | null;
  description: string | null;
  status: string;
  hiddenGem: boolean;
  needsReview: boolean;
  submitterName: string | null;
};

export async function getAdminSpotDetail(spotId: string): Promise<AdminSpotDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("spots")
    .select(
      "id, name, category, price_range, address, city, province, description, status, hidden_gem, needs_review, submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)"
    )
    .eq("id", spotId)
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
    hiddenGem: data.hidden_gem,
    needsReview: data.needs_review,
    submitterName: data.submitted_by_profile?.display_name ?? null,
  };
}

export async function getMissingCoordinatesCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("spots")
    .select("id", { count: "exact", head: true })
    .or("lat.is.null,lng.is.null");
  return count ?? 0;
}

export type AdminOverviewStats = {
  approvedSpots: number;
  pendingSpots: number;
  flaggedSpots: number;
  totalUsers: number;
  totalReviews: number;
  totalCollections: number;
  totalSaves: number;
  spotsByCity: { city: string; count: number }[];
};

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const supabase = await createServerSupabaseClient();

  const [
    { count: approvedSpots },
    { count: pendingSpots },
    { count: flaggedSpots },
    { count: totalUsers },
    { count: totalReviews },
    { count: totalCollections },
    { data: savedSpots },
    { data: citySpots },
  ] = await Promise.all([
    supabase
      .from("spots")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("spots")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("spots")
      .select("id", { count: "exact", head: true })
      .eq("needs_review", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("collections").select("id", { count: "exact", head: true }),
    supabase.from("saved_list_spots").select("spot_id"),
    supabase.from("spots").select("city").eq("status", "approved"),
  ]);

  const cityCounts = new Map<string, number>();
  for (const row of citySpots ?? []) {
    cityCounts.set(row.city, (cityCounts.get(row.city) ?? 0) + 1);
  }
  const spotsByCity = Array.from(cityCounts.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    approvedSpots: approvedSpots ?? 0,
    pendingSpots: pendingSpots ?? 0,
    flaggedSpots: flaggedSpots ?? 0,
    totalUsers: totalUsers ?? 0,
    totalReviews: totalReviews ?? 0,
    totalCollections: totalCollections ?? 0,
    totalSaves: savedSpots?.length ?? 0,
    spotsByCity,
  };
}
