import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const SITE_URL = "https://navey.co";

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/explore", priority: 0.9 },
  { path: "/explore/map", priority: 0.7 },
  { path: "/community", priority: 0.6 },
  { path: "/onboarding", priority: 0.6 },
  { path: "/submit-a-spot", priority: 0.5 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: spots }, { data: collections }] = await Promise.all([
    supabase.from("spots").select("id, created_at").eq("status", "approved"),
    supabase.from("collections").select("id, created_at"),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    priority: route.priority,
  }));

  const spotEntries: MetadataRoute.Sitemap = (spots ?? []).map((spot) => ({
    url: `${SITE_URL}/spots/${spot.id}`,
    lastModified: spot.created_at,
    priority: 0.8,
  }));

  const collectionEntries: MetadataRoute.Sitemap = (collections ?? []).map(
    (collection) => ({
      url: `${SITE_URL}/collections/${collection.id}`,
      lastModified: collection.created_at,
      priority: 0.6,
    })
  );

  return [...staticEntries, ...spotEntries, ...collectionEntries];
}
