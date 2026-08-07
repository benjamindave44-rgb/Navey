import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotCard } from "@/components/SpotCard";
import { findCityBySlug, getCityDirectory } from "@/lib/cities";
import { areaPath, getAreasInCity } from "@/lib/areas";
import { servesCoffeeOrBakes, servesMeals } from "@/lib/categories";
import { getApprovedSpots } from "@/lib/queries";
import { getSavedSpotIds } from "@/lib/profile";

export const dynamic = "force-dynamic";

const SITE = "https://www.navey.co";

function summarise(city: string, count: number, coffee: number, food: number) {
  const places = `${count} ${count === 1 ? "spot" : "spots"}`;
  const mix =
    coffee > 0 && food > 0
      ? `${coffee} for coffee and ${food} for a proper meal`
      : coffee > 0
        ? "all of them coffee-first"
        : "all of them worth a meal";
  return `${places} in ${city} worth the trip — ${mix}, each one visited and written up rather than scraped from a directory.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await findCityBySlug(slug);
  if (!entry) return { title: "City not found" };

  const description = `Find the best coffee shops and restaurants in ${entry.city}, Philippines. ${entry.count} hand-picked ${entry.count === 1 ? "spot" : "spots"} with photos, opening hours, and directions on Navey.`;

  return {
    title: `Coffee Shops & Restaurants in ${entry.city}`,
    description,
    alternates: { canonical: `/city/${entry.slug}` },
    openGraph: {
      title: `Coffee Shops & Restaurants in ${entry.city}`,
      description,
      type: "website",
      url: `${SITE}/city/${entry.slug}`,
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await findCityBySlug(slug);
  if (!entry) notFound();

  const [spots, savedSpotIds, directory, areas] = await Promise.all([
    getApprovedSpots({ city: entry.city }),
    getSavedSpotIds(),
    getCityDirectory(),
    getAreasInCity(entry.city),
  ]);

  const coffee = spots.filter((spot) => servesCoffeeOrBakes(spot.category)).length;
  const food = spots.filter((spot) => servesMeals(spot.category)).length;

  // The tags people in this city actually get, ranked -- both a genuine
  // summary of the area's character and a set of internal links.
  const tagCounts = new Map<string, number>();
  for (const spot of spots) {
    for (const tag of spot.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const others = directory.filter((city) => city.slug !== entry.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `Coffee Shops & Restaurants in ${entry.city}`,
        url: `${SITE}/city/${entry.slug}`,
        about: { "@type": "Place", name: entry.city, address: { "@type": "PostalAddress", addressLocality: entry.city, addressCountry: "PH" } },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: spots.length,
          itemListElement: spots.map((spot, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE}/spots/${spot.id}`,
            name: spot.name,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Navey", item: SITE },
          { "@type": "ListItem", position: 2, name: "Explore", item: `${SITE}/explore` },
          {
            "@type": "ListItem",
            position: 3,
            name: entry.city,
            item: `${SITE}/city/${entry.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main id="main" className="flex-1 px-4 py-10 sm:px-6 md:px-12">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs font-semibold text-navey-ink/50">
          <Link href="/" className="hover:text-navey-ink">
            Navey
          </Link>{" "}
          ›{" "}
          <Link href="/explore" className="hover:text-navey-ink">
            Explore
          </Link>{" "}
          › <span className="text-navey-ink">{entry.city}</span>
        </nav>

        <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">
          Coffee Shops &amp; Restaurants in {entry.city}
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium text-navey-ink/70">
          {summarise(entry.city, spots.length, coffee, food)}
        </p>

        {/* Sent down to the neighbourhood pages, which are what people
            actually search for. Placed above the tags because "BGC" is a
            stronger intent than "Chill". */}
        {areas.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navey-ink/45">
              Neighbourhoods
            </p>
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <Link
                  key={area.districtSlug}
                  href={areaPath(area)}
                  className="rounded-full bg-navey-ink px-4 py-2 text-sm font-semibold text-navey-yellow transition-transform hover:-translate-y-0.5"
                >
                  {area.district}
                  <span className="ml-1.5 opacity-60">{area.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {topTags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <Link
                key={tag}
                href={`/explore?city=${encodeURIComponent(entry.city)}&tags=${encodeURIComponent(tag)}`}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-[0_4px_12px_rgba(20,18,11,0.06)] transition-transform hover:-translate-y-0.5"
              >
                {tag}
                <span className="ml-1.5 text-navey-ink/40">{count}</span>
              </Link>
            ))}
          </div>
        )}

        {spots.length === 0 ? (
          <p className="mt-8 text-sm text-navey-ink/60">
            Nothing listed here yet.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {spots.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                showSaveButton
                saved={savedSpotIds.has(spot.id)}
              />
            ))}
          </div>
        )}

        {others.length > 0 && (
          <section className="mt-14">
            <h2 className="font-heading text-xl font-extrabold">
              Other cities on Navey
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {others.map((city) => (
                <Link
                  key={city.slug}
                  href={`/city/${city.slug}`}
                  className="rounded-full bg-navey-band px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:bg-navey-ink hover:text-navey-yellow"
                >
                  {city.city}
                  <span className="ml-1.5 opacity-50">{city.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
