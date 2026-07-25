import { supabase } from "@/lib/supabase";
import { computeTopBadge } from "@/lib/badges";

export type CommunityStats = {
  explorers: number;
  spotsSaved: number;
  hiddenGemsFound: number;
};

export async function getCommunityStats(): Promise<CommunityStats> {
  const [{ count: explorers }, { data: savedSpots }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("saved_list_spots").select("spot_id, spots(hidden_gem)"),
  ]);

  const uniqueSpotIds = new Set<string>();
  const hiddenGemIds = new Set<string>();
  for (const row of savedSpots ?? []) {
    uniqueSpotIds.add(row.spot_id);
    if (row.spots?.hidden_gem) hiddenGemIds.add(row.spot_id);
  }

  return {
    explorers: explorers ?? 0,
    spotsSaved: uniqueSpotIds.size,
    hiddenGemsFound: hiddenGemIds.size,
  };
}

export type ActivityItem = {
  id: string;
  type: "submitted_spot" | "created_list";
  actorId: string | null;
  actorName: string;
  createdAt: string;
  spotName?: string;
  spotId?: string;
  city?: string;
  listName?: string;
};

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const [{ data: submissions }, { data: lists }] = await Promise.all([
    supabase
      .from("spots")
      .select(
        "id, name, city, created_at, submitted_by, submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)"
      )
      .not("submitted_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("saved_lists")
      .select("id, name, created_at, user_id, profiles(display_name)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: ActivityItem[] = [
    ...(submissions ?? []).map((spot) => ({
      id: `spot-${spot.id}`,
      type: "submitted_spot" as const,
      actorId: spot.submitted_by,
      actorName: spot.submitted_by_profile?.display_name ?? "Someone",
      createdAt: spot.created_at,
      spotName: spot.name,
      spotId: spot.id,
      city: spot.city,
    })),
    ...(lists ?? []).map((list) => ({
      id: `list-${list.id}`,
      type: "created_list" as const,
      actorId: list.user_id,
      actorName: list.profiles?.display_name ?? "Someone",
      createdAt: list.created_at,
      listName: list.name,
    })),
  ];

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return items.slice(0, limit);
}

export type TopContributor = {
  id: string;
  name: string;
  approvedCount: number;
};

export async function getTopContributors(limit = 5): Promise<TopContributor[]> {
  const { data } = await supabase
    .from("spots")
    .select(
      "submitted_by, submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)"
    )
    .eq("status", "approved")
    .not("submitted_by", "is", null);

  if (!data) return [];

  const counts = new Map<string, { name: string; count: number }>();
  for (const row of data) {
    if (!row.submitted_by) continue;
    const existing = counts.get(row.submitted_by);
    const name = row.submitted_by_profile?.display_name ?? "Someone";
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(row.submitted_by, { name, count: 1 });
    }
  }

  return Array.from(counts.entries())
    .map(([id, v]) => ({ id, name: v.name, approvedCount: v.count }))
    .sort((a, b) => b.approvedCount - a.approvedCount)
    .slice(0, limit);
}

const LEADERBOARD_POINTS = {
  review: 10,
  save: 5,
  submission: 20,
  hiddenGemBonus: 15,
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  points: number;
  badge: string;
  reviewsCount: number;
  savesCount: number;
  submittedCount: number;
  hiddenGemCount: number;
  listsCount: number;
};

/**
 * All-time points leaderboard. Points come from real activity: reviews
 * written, spots saved, spots submitted (with a bonus for hidden gems),
 * and lists created. There's no per-save timestamp in the schema, so
 * this can't honestly be scoped to "this month" -- it's all-time.
 */
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const [{ data: profiles }, { data: reviews }, { data: lists }, { data: listSpots }, { data: spots }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase.from("reviews").select("user_id"),
      supabase.from("saved_lists").select("id, user_id"),
      supabase.from("saved_list_spots").select("list_id"),
      supabase
        .from("spots")
        .select("submitted_by, hidden_gem")
        .eq("status", "approved")
        .not("submitted_by", "is", null),
    ]);

  const listOwner = new Map<string, string>();
  for (const list of lists ?? []) listOwner.set(list.id, list.user_id);

  type Stats = {
    reviews: number;
    saves: number;
    lists: number;
    submissions: number;
    hiddenGems: number;
  };
  const stats = new Map<string, Stats>();
  const statsFor = (id: string) => {
    let entry = stats.get(id);
    if (!entry) {
      entry = { reviews: 0, saves: 0, lists: 0, submissions: 0, hiddenGems: 0 };
      stats.set(id, entry);
    }
    return entry;
  };

  for (const review of reviews ?? []) statsFor(review.user_id).reviews += 1;
  for (const list of lists ?? []) statsFor(list.user_id).lists += 1;
  for (const listSpot of listSpots ?? []) {
    const ownerId = listOwner.get(listSpot.list_id);
    if (ownerId) statsFor(ownerId).saves += 1;
  }
  for (const spot of spots ?? []) {
    if (!spot.submitted_by) continue;
    const entry = statsFor(spot.submitted_by);
    entry.submissions += 1;
    if (spot.hidden_gem) entry.hiddenGems += 1;
  }

  const nameById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name ?? "Explorer"])
  );

  return Array.from(stats.entries())
    .map(([id, s]) => {
      const points =
        s.reviews * LEADERBOARD_POINTS.review +
        s.saves * LEADERBOARD_POINTS.save +
        s.submissions * LEADERBOARD_POINTS.submission +
        s.hiddenGems * LEADERBOARD_POINTS.hiddenGemBonus;

      return {
        id,
        name: nameById.get(id) ?? "Explorer",
        points,
        badge: computeTopBadge({
          reviews: s.reviews,
          saves: s.saves,
          hiddenGems: s.hiddenGems,
          lists: s.lists,
        }),
        reviewsCount: s.reviews,
        savesCount: s.saves,
        submittedCount: s.submissions,
        hiddenGemCount: s.hiddenGems,
        listsCount: s.lists,
      };
    })
    .filter((entry) => entry.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}
