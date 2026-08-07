import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotCard } from "@/components/SpotCard";
import { areaPath, findArea, getAreaDirectory } from "@/lib/areas";
import { servesCoffeeOrBakes, servesMeals } from "@/lib/categories";
import { getApprovedSpots } from "@/lib/queries";
import { citySlug } from "@/lib/slug";

// Built once and shared rather than rebuilt for every visitor. Nothing on the
// page differs between people any more: the header's account controls and the
// saved hearts both resolve in the browser. Five minutes is the longest a
// newly approved listing waits to appear here.
export const revalidate = 300;

const SITE = "https://www.navey.co";

export async function generateStaticParams() {
  const directory = await getAreaDirectory();
  return directory.map((entry) => ({
    city: entry.citySlug,
    district: entry.districtSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; district: string }>;
}): Promise<Metadata> {
  const { city, district } = await params;
  const area = await findArea(city, district);
  if (!area) return { title: "Not found" };

  const title = `Coffee Shops & Restaurants in ${area.district}`;
  const description = `The best coffee shops and places to eat in ${area.district}, ${area.city}. ${area.count} hand-picked ${area.count === 1 ? "spot" : "spots"} with photos, opening hours and directions on Navey.`;

  return {
    title,
    description,
    alternates: { canonical: areaPath(area) },
    openGraph: { title, description, type: "website", url: `${SITE}${areaPath(area)}` },
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ city: string; district: string }>;
}) {
  const { city, district } = await params;
  const area = await findArea(city, district);
  if (!area) notFound();

  const [spots, directory] = await Promise.all([
    getApprovedSpots({ district: area.district }),
    getAreaDirectory(),
  ]);

  const coffee = spots.filter((spot) => servesCoffeeOrBakes(spot.category)).length;
  const food = spots.filter((spot) => servesMeals(spot.category)).length;
  const openNow = spots.filter((spot) => spot.openState === "open").length;

  const nearby = directory.filter(
    (entry) =>
      entry.city === area.city && entry.districtSlug !== area.districtSlug
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `Coffee Shops & Restaurants in ${area.district}`,
        url: `${SITE}${areaPath(area)}`,
        about: {
          "@type": "Place",
          name: area.district,
          address: {
            "@type": "PostalAddress",
            addressLocality: area.city,
            addressCountry: "PH",
          },
        },
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
        // The hierarchy is stated explicitly so the district reads as part of
        // its city rather than a rival page about the same place.
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Navey", item: SITE },
          { "@type": "ListItem", position: 2, name: "Explore", item: `${SITE}/explore` },
          {
            "@type": "ListItem",
            position: 3,
            name: area.city,
            item: `${SITE}/city/${citySlug(area.city)}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: area.district,
            item: `${SITE}${areaPath(area)}`,
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
        <nav
          aria-label="Breadcrumb"
          className="mb-4 text-xs font-semibold text-navey-ink/50"
        >
          <Link href="/" className="hover:text-navey-ink">
            Navey
          </Link>{" "}
          ›{" "}
          <Link href={`/city/${citySlug(area.city)}`} className="hover:text-navey-ink">
            {area.city}
          </Link>{" "}
          › <span className="text-navey-ink">{area.district}</span>
        </nav>

        <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">
          Coffee Shops &amp; Restaurants in {area.district}
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium text-navey-ink/70">
          {spots.length} {spots.length === 1 ? "spot" : "spots"} in{" "}
          {area.district}
          {coffee > 0 && food > 0
            ? ` — ${coffee} for coffee and ${food} for a proper meal`
            : ""}
          , each one visited and written up rather than scraped from a
          directory.
          {openNow > 0 && (
            <span className="font-bold text-navey-ink"> {openNow} open right now.</span>
          )}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {spots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              showSaveButton
            />
          ))}
        </div>

        {nearby.length > 0 && (
          <section className="mt-14">
            <h2 className="font-heading text-xl font-extrabold">
              Nearby in {area.city}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {nearby.map((entry) => (
                <Link
                  key={`${entry.citySlug}/${entry.districtSlug}`}
                  href={areaPath(entry)}
                  className="rounded-full bg-navey-band px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:bg-navey-ink hover:text-navey-yellow"
                >
                  {entry.district}
                  <span className="ml-1.5 opacity-50">{entry.count}</span>
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
