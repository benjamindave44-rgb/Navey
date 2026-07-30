import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PaginatedSpotGrid } from "@/components/PaginatedSpotGrid";
import { getApprovedSpots, getCities, getTags, type SpotSort } from "@/lib/queries";
import { getSavedSpotIds } from "@/lib/profile";

export const dynamic = "force-dynamic";

/**
 * robots.txt already keeps well-behaved crawlers off filtered URLs, but not
 * every bot honours it. A filtered view is the same spots in a different
 * order, so it points search engines back at the unfiltered page rather than
 * competing with it -- and asks not to be indexed in its own right, while
 * still letting crawlers follow through to the individual spot pages.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  // Repeated keys arrive as arrays (?tags=a&tags=b), so this cannot just read
  // the first value -- a multi-tag filter would look unfiltered.
  const isFiltered = ["q", "category", "city", "tags", "sort", "page"].some(
    (key) => {
      const value = params[key];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    }
  );

  return {
    title: "Explore Coffee Shops & Restaurants in the Philippines",
    description:
      "Search and filter coffee shops and restaurants across the Philippines by city, vibe, and price. Find your next favorite spot on Navey.",
    alternates: { canonical: "/explore" },
    ...(isFiltered ? { robots: { index: false, follow: true } } : {}),
  };
}

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "coffee_shop", label: "Coffee Shop" },
  { value: "restaurant", label: "Restaurant" },
  { value: "both", label: "Coffee Shop & Restaurant" },
];

const SORT_OPTIONS: { value: SpotSort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "most_saved", label: "Most Saved" },
];

function firstParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function buildHref(
  base: Record<string, string>,
  overrides: Record<string, string | undefined>
): string {
  const merged = { ...base, ...overrides };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) query.set(key, value);
  }
  const queryString = query.toString();
  return queryString ? `/explore?${queryString}` : "/explore";
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = firstParam(params.q);
  const category = firstParam(params.category);
  const city = firstParam(params.city);
  const sortParam = firstParam(params.sort);
  const sort: SpotSort = (["recommended", "newest", "most_saved"] as string[]).includes(
    sortParam
  )
    ? (sortParam as SpotSort)
    : "recommended";
  const activeTags = firstParam(params.tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const [spots, cities, tags, savedSpotIds] = await Promise.all([
    getApprovedSpots({ search, category, city, tags: activeTags, sort }),
    getCities(),
    getTags(),
    getSavedSpotIds(),
  ]);

  const baseParams = {
    q: search,
    category,
    city,
    sort,
    tags: activeTags.join(","),
  };

  const hasActiveFilters = Boolean(search || category || city || activeTags.length > 0);

  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-6 py-10 md:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl font-extrabold">Explore Spots</h1>
          <div className="flex gap-1 rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
            <span className="rounded-full bg-navey-ink px-4 py-1.5 text-xs font-bold text-navey-yellow">
              List
            </span>
            <Link
              href="/explore/map"
              className="rounded-full px-4 py-1.5 text-xs font-bold text-navey-ink/60 hover:text-navey-ink"
            >
              Map
            </Link>
          </div>
        </div>
        <p className="mt-2 text-sm text-navey-ink/60">
          {spots.length} spot{spots.length === 1 ? "" : "s"} found
        </p>

        <form className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search spots, cities, vibes..."
              className="w-full rounded-full bg-white px-4 py-2 pr-9 text-sm shadow-[0_8px_24px_rgba(20,18,11,0.08)] outline-none"
            />
            {search && (
              <Link
                href={buildHref(baseParams, { q: "" })}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navey-ink/50 hover:text-navey-ink"
              >
                ×
              </Link>
            )}
          </div>
          <select
            name="category"
            defaultValue={category}
            className="rounded-full bg-white px-4 py-2 text-sm shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
          >
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            name="city"
            defaultValue={city}
            className="rounded-full bg-white px-4 py-2 text-sm shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
          >
            <option value="">All cities</option>
            {cities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-full bg-white px-4 py-2 text-sm shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </select>
          {activeTags.length > 0 && (
            <input type="hidden" name="tags" value={activeTags.join(",")} />
          )}
          <button
            type="submit"
            className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow"
          >
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tags.map((option) => {
            const isActive = activeTags.includes(option.label);
            const nextTags = isActive
              ? activeTags.filter((t) => t !== option.label)
              : [...activeTags, option.label];
            return (
              <Link
                key={option.id}
                href={buildHref(baseParams, { tags: nextTags.join(",") })}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  isActive ? "bg-navey-ink text-navey-yellow" : "bg-white"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
          {hasActiveFilters && (
            <Link
              href="/explore"
              className="rounded-full px-4 py-2 text-xs font-semibold text-navey-ink/50 hover:text-navey-ink"
            >
              Clear all
            </Link>
          )}
        </div>

        {!hasActiveFilters && cities.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navey-ink/50">
              Trending cities
            </p>
            <div className="flex flex-wrap gap-2">
              {cities.slice(0, 8).map((option) => (
                <Link
                  key={option}
                  href={buildHref(baseParams, { city: option })}
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold hover:bg-navey-band"
                >
                  {option}
                </Link>
              ))}
            </div>
          </div>
        )}

        {spots.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl" aria-hidden>
              🔍
            </span>
            <h2 className="font-heading text-xl font-extrabold">
              {search ? `No spots found for "${search}"` : "No spots match your filters yet"}
            </h2>
            <p className="max-w-sm text-sm text-navey-ink/60">
              Try a different city or vibe — or be the first to add it.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {hasActiveFilters && (
                <Link
                  href="/explore"
                  className="rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-bold hover:bg-navey-band"
                >
                  Clear filters
                </Link>
              )}
              <Link
                href="/submit-a-spot"
                className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
              >
                Submit a Spot
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <PaginatedSpotGrid spots={spots} savedSpotIds={[...savedSpotIds]} />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
