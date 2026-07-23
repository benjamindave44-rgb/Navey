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

export async function getApprovedSpots(limit = 8): Promise<SpotWithTags[]> {
  const { data, error } = await supabase
    .from("spots")
    .select(
      "id, name, category, price_range, city, province, hidden_gem, description, spot_tags(tags(label))"
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((spot) => ({
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
