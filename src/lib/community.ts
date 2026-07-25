import { supabase } from "@/lib/supabase";

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
        "id, name, city, created_at, submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)"
      )
      .not("submitted_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("saved_lists")
      .select("id, name, created_at, profiles(display_name)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: ActivityItem[] = [
    ...(submissions ?? []).map((spot) => ({
      id: `spot-${spot.id}`,
      type: "submitted_spot" as const,
      actorName: spot.submitted_by_profile?.display_name ?? "Someone",
      createdAt: spot.created_at,
      spotName: spot.name,
      spotId: spot.id,
      city: spot.city,
    })),
    ...(lists ?? []).map((list) => ({
      id: `list-${list.id}`,
      type: "created_list" as const,
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
