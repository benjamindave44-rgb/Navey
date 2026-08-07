import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { getCityDirectory } from "@/lib/cities";
import { getTagDirectory } from "@/lib/tags";
import { getAreaDirectory } from "@/lib/areas";

const SITE_URL = "https://www.navey.co";

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/explore", priority: 0.9 },
  { path: "/explore/map", priority: 0.7 },
  { path: "/collections", priority: 0.7 },
  { path: "/community", priority: 0.6 },
  { path: "/about", priority: 0.5 },
  { path: "/leaderboard", priority: 0.5 },
  { path: "/onboarding", priority: 0.6 },
  { path: "/submit-a-spot", priority: 0.5 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: spots }, { data: collections }, cities, tags, areas] = await Promise.all([
    supabase.from("spots").select("id, created_at").eq("status", "approved"),
    supabase.from("collections").select("id, created_at"),
    getCityDirectory(),
    getTagDirectory(),
    getAreaDirectory(),
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

  // Ranked above collections: a city page is what someone searching
  // "coffee shops in Taguig" is actually looking for.
  const cityEntries: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${SITE_URL}/city/${city.slug}`,
    priority: 0.8,
  }));

  // Same reasoning as the city pages: these answer a search a filtered
  // Explore URL never could.
  const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${SITE_URL}/tag/${tag.slug}`,
    priority: 0.7,
  }));

  // Ranked highest of the generated pages: a neighbourhood is the most
  // specific thing someone searches for.
  const areaEntries: MetadataRoute.Sitemap = areas.map((area) => ({
    url: `${SITE_URL}/area/${area.slug}`,
    priority: 0.9,
  }));

  return [
    ...staticEntries,
    ...areaEntries,
    ...cityEntries,
    ...tagEntries,
    ...spotEntries,
    ...collectionEntries,
  ];
}
