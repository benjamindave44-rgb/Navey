import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Spot ids the signed-in person has saved, so cards render in the right
 * state on first paint instead of flashing unsaved. Empty when signed out.
 */
export async function getSavedSpotIds(): Promise<Set<string>> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("saved_list_spots")
    .select("spot_id, saved_lists!inner(user_id)")
    .eq("saved_lists.user_id", user.id);

  return new Set((data ?? []).map((row) => row.spot_id));
}
import { supabase } from "@/lib/supabase";
import { computeTopBadge } from "@/lib/badges";

export type ProfileSavedList = {
  id: string;
  name: string;
  isPublic: boolean;
  spotCount: number;
  /** Cover photos of the first few spots on the list, for the card. A list of
   *  real places should look like the places, not like a filing cabinet. */
  covers: string[];
};

export type ProfileReview = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  spotId: string;
  spotName: string;
};

export type ProfileContribution = {
  id: string;
  name: string;
  city: string;
  status: string;
  createdAt: string;
};

export type ProfileData = {
  id: string;
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  stats: {
    spotsSaved: number;
    reviewsCount: number;
    hiddenGemsFound: number;
    listsCreated: number;
  };
  savedLists: ProfileSavedList[];
  reviews: ProfileReview[];
  contributions: ProfileContribution[];
};

export async function getProfileData(userId: string): Promise<ProfileData | null> {
  const supabase = await createServerSupabaseClient();

  const [{ data: profile }, { data: lists }, { data: reviews }, { data: contributions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, handle, avatar_url, created_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("saved_lists")
        .select(
          "id, name, is_public, created_at, saved_list_spots(spot_id, spots(hidden_gem, spot_photos(url, kind)))"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("id, rating, body, created_at, spots(id, name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("spots")
        .select("id, name, city, status, created_at")
        .eq("submitted_by", userId)
        .order("created_at", { ascending: false }),
    ]);

  if (!profile) return null;

  const savedSpotIds = new Set<string>();
  const hiddenGemSpotIds = new Set<string>();
  const savedLists: ProfileSavedList[] = (lists ?? []).map((list) => {
    for (const entry of list.saved_list_spots) {
      savedSpotIds.add(entry.spot_id);
      if (entry.spots?.hidden_gem) hiddenGemSpotIds.add(entry.spot_id);
    }
    return {
      id: list.id,
      name: list.name,
      isPublic: list.is_public,
      spotCount: list.saved_list_spots.length,
      // Four is what the card can show; asking for more would be fetched and
      // thrown away.
      covers: list.saved_list_spots
        .map(
          (entry) =>
            entry.spots?.spot_photos.find((photo) => photo.kind === "gallery")
              ?.url ?? null
        )
        .filter((url): url is string => Boolean(url))
        .slice(0, 4),
    };
  });

  return {
    id: profile.id,
    displayName: profile.display_name ?? "Explorer",
    handle: profile.handle,
    avatarUrl: profile.avatar_url,
    joinedAt: profile.created_at,
    stats: {
      spotsSaved: savedSpotIds.size,
      reviewsCount: reviews?.length ?? 0,
      hiddenGemsFound: hiddenGemSpotIds.size,
      listsCreated: savedLists.length,
    },
    savedLists,
    reviews: (reviews ?? []).map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body,
      createdAt: review.created_at,
      spotId: review.spots?.id ?? "",
      spotName: review.spots?.name ?? "Unknown spot",
    })),
    contributions: (contributions ?? []).map((spot) => ({
      id: spot.id,
      name: spot.name,
      city: spot.city,
      status: spot.status,
      createdAt: spot.created_at,
    })),
  };
}

export type PublicProfileList = {
  id: string;
  name: string;
  spotCount: number;
};

export type PublicProfileReview = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  spotId: string;
  spotName: string;
};

export type PublicProfileContribution = {
  id: string;
  name: string;
  city: string;
  createdAt: string;
};

export type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string;
  badge: string;
  stats: {
    spotsSaved: number;
    reviewsCount: number;
    hiddenGemsFound: number;
    listsCreated: number;
  };
  publicLists: PublicProfileList[];
  reviews: PublicProfileReview[];
  contributions: PublicProfileContribution[];
};

/**
 * A privacy-aware view of a profile for anyone to see: only public
 * saved lists and only approved submissions, unlike getProfileData
 * (which is for the signed-in owner viewing their own full profile).
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const [{ data: profile }, { data: lists }, { data: reviews }, { data: contributions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url, created_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("saved_lists")
        .select("id, name, created_at, saved_list_spots(spot_id, spots(hidden_gem))")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("id, rating, body, created_at, spots(id, name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("spots")
        .select("id, name, city, created_at")
        .eq("submitted_by", userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
    ]);

  if (!profile) return null;

  const savedSpotIds = new Set<string>();
  const hiddenGemSpotIds = new Set<string>();
  const publicLists: PublicProfileList[] = (lists ?? []).map((list) => {
    for (const entry of list.saved_list_spots) {
      savedSpotIds.add(entry.spot_id);
      if (entry.spots?.hidden_gem) hiddenGemSpotIds.add(entry.spot_id);
    }
    return {
      id: list.id,
      name: list.name,
      spotCount: list.saved_list_spots.length,
    };
  });

  return {
    id: profile.id,
    displayName: profile.display_name ?? "Explorer",
    avatarUrl: profile.avatar_url,
    joinedAt: profile.created_at,
    badge: computeTopBadge({
      reviews: reviews?.length ?? 0,
      saves: savedSpotIds.size,
      hiddenGems: hiddenGemSpotIds.size,
      lists: publicLists.length,
    }),
    stats: {
      spotsSaved: savedSpotIds.size,
      reviewsCount: reviews?.length ?? 0,
      hiddenGemsFound: hiddenGemSpotIds.size,
      listsCreated: publicLists.length,
    },
    publicLists,
    reviews: (reviews ?? []).map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body,
      createdAt: review.created_at,
      spotId: review.spots?.id ?? "",
      spotName: review.spots?.name ?? "Unknown spot",
    })),
    contributions: (contributions ?? []).map((spot) => ({
      id: spot.id,
      name: spot.name,
      city: spot.city,
      createdAt: spot.created_at,
    })),
  };
}
