import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotCard } from "@/components/SpotCard";
import { getApprovedSpots, getCities, getTags } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "coffee_shop", label: "Coffee Shop" },
  { value: "restaurant", label: "Restaurant" },
  { value: "both", label: "Coffee Shop & Restaurant" },
];

function firstParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
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
  const tag = firstParam(params.tag);

  const [spots, cities, tags] = await Promise.all([
    getApprovedSpots({ search, category, city, tag }),
    getCities(),
    getTags(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1 px-6 py-10 md:px-12">
        <h1 className="font-heading text-3xl font-extrabold">Explore Spots</h1>
        <p className="mt-2 text-sm text-navey-ink/60">
          {spots.length} spot{spots.length === 1 ? "" : "s"} found
        </p>

        <form className="mt-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search spots, cities, vibes..."
            className="min-w-[200px] flex-1 rounded-full bg-white px-4 py-2 text-sm shadow-[0_8px_24px_rgba(20,18,11,0.08)] outline-none"
          />
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
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button
            type="submit"
            className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow"
          >
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/explore"
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              !tag ? "bg-navey-ink text-navey-yellow" : "bg-white"
            }`}
          >
            All vibes
          </Link>
          {tags.map((option) => (
            <Link
              key={option.id}
              href={`/explore?tag=${encodeURIComponent(option.label)}`}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                tag === option.label
                  ? "bg-navey-ink text-navey-yellow"
                  : "bg-white"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        {spots.length === 0 ? (
          <p className="mt-10 text-sm text-navey-ink/60">
            No spots match your filters yet. Try widening your search.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
