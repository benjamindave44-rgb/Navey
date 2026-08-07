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
  featured: boolean;
  createdAt: string;
};

export async function getAdminSpotList(filters: {
  search?: string;
  status?: string;
}): Promise<AdminSpotListItem[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("spots")
    .select("id, name, city, category, status, needs_review, featured, created_at")
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
    featured: spot.featured,
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
  district: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  status: string;
  hiddenGem: boolean;
  needsReview: boolean;
  featured: boolean;
  featuredRank: number;
  submitterName: string | null;
  hours: {
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
    is24Hours: boolean;
  }[];
};

export async function getAdminSpotDetail(spotId: string): Promise<AdminSpotDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("spots")
    .select(
      "id, name, category, price_range, address, city, province, district, lat, lng, description, status, hidden_gem, needs_review, featured, featured_rank, spot_hours(day_of_week, open_time, close_time, is_closed, is_24_hours), submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)"
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
    district: data.district,
    lat: data.lat,
    lng: data.lng,
    description: data.description,
    status: data.status,
    hiddenGem: data.hidden_gem,
    needsReview: data.needs_review,
    featured: data.featured,
    featuredRank: data.featured_rank,
    submitterName: data.submitted_by_profile?.display_name ?? null,
    hours: data.spot_hours.map((hour) => ({
      dayOfWeek: hour.day_of_week,
      openTime: hour.open_time,
      closeTime: hour.close_time,
      isClosed: hour.is_closed,
      is24Hours: hour.is_24_hours,
    })),
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

export type AdminCollectionListItem = {
  id: string;
  title: string;
  description: string | null;
  spotCount: number;
  createdAt: string;
};

export async function getAdminCollections(): Promise<AdminCollectionListItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("collections")
    .select("id, title, description, created_at, collection_spots(spot_id)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((collection) => ({
    id: collection.id,
    title: collection.title,
    description: collection.description,
    spotCount: collection.collection_spots.length,
    createdAt: collection.created_at,
  }));
}

export type AdminCollectionDetail = {
  id: string;
  title: string;
  description: string | null;
  spots: { id: string; name: string; city: string; rank: number }[];
};

export async function getAdminCollectionDetail(
  collectionId: string
): Promise<AdminCollectionDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("collections")
    .select(
      "id, title, description, collection_spots(rank, spots(id, name, city))"
    )
    .eq("id", collectionId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    spots: data.collection_spots
      .filter((entry) => entry.spots)
      .map((entry) => ({
        id: entry.spots!.id,
        name: entry.spots!.name,
        city: entry.spots!.city,
        rank: entry.rank,
      }))
      .sort((a, b) => a.rank - b.rank),
  };
}

/** Approved spots not already in the collection, for the add picker. */
export async function getSpotsAvailableForCollection(
  collectionId: string
): Promise<{ id: string; name: string; city: string }[]> {
  const supabase = await createServerSupabaseClient();
  const [{ data: spots }, { data: existing }] = await Promise.all([
    supabase
      .from("spots")
      .select("id, name, city")
      .eq("status", "approved")
      .order("name"),
    supabase.from("collection_spots").select("spot_id").eq("collection_id", collectionId),
  ]);

  const taken = new Set((existing ?? []).map((row) => row.spot_id));
  return (spots ?? []).filter((spot) => !taken.has(spot.id));
}

export type AdminReview = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  needsReview: boolean;
  reportCount: number;
  reportReasons: string[];
  authorName: string | null;
  spotId: string;
  spotName: string;
};

export async function getAdminReviews(
  onlyFlagged = false
): Promise<AdminReview[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("reviews")
    .select(
      "id, rating, body, created_at, needs_review, profiles!reviews_user_id_fkey(display_name), spots(id, name), review_reports(reason)"
    )
    .order("created_at", { ascending: false });

  if (onlyFlagged) query = query.eq("needs_review", true);

  const { data } = await query;

  return (data ?? []).map((review) => ({
    id: review.id,
    rating: review.rating,
    body: review.body,
    createdAt: review.created_at,
    needsReview: review.needs_review,
    reportCount: review.review_reports.length,
    reportReasons: review.review_reports
      .map((report) => report.reason)
      .filter((reason): reason is string => Boolean(reason)),
    authorName: review.profiles?.display_name ?? null,
    spotId: review.spots?.id ?? "",
    spotName: review.spots?.name ?? "Unknown spot",
  }));
}

export async function getFlaggedReviewCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("needs_review", true);
  return count ?? 0;
}

export type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  provider: string | null;
  spotCount: number;
  reviewCount: number;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = await createServerSupabaseClient();

  // Emails come through a definer function; auth.users isn't readable here.
  const [{ data: users }, { data: spots }, { data: reviews }] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase.from("spots").select("submitted_by"),
    supabase.from("reviews").select("user_id"),
  ]);

  const spotsBy = new Map<string, number>();
  for (const spot of spots ?? []) {
    if (!spot.submitted_by) continue;
    spotsBy.set(spot.submitted_by, (spotsBy.get(spot.submitted_by) ?? 0) + 1);
  }
  const reviewsBy = new Map<string, number>();
  for (const review of reviews ?? []) {
    reviewsBy.set(review.user_id, (reviewsBy.get(review.user_id) ?? 0) + 1);
  }

  return (users ?? []).map((user) => ({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    createdAt: user.created_at,
    provider: user.provider,
    spotCount: spotsBy.get(user.id) ?? 0,
    reviewCount: reviewsBy.get(user.id) ?? 0,
  }));
}
