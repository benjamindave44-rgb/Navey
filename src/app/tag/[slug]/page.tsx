import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotCard } from "@/components/SpotCard";
import { findTagBySlug, getTagDirectory } from "@/lib/tags";
import { getApprovedSpots } from "@/lib/queries";
import { citySlug } from "@/lib/slug";

// Built once and shared rather than rebuilt for every visitor. Nothing on the
// page differs between people any more: the header's account controls and the
// saved hearts both resolve in the browser. Five minutes is the longest a
// newly approved listing waits to appear here.
export const revalidate = 300;

const SITE = "https://www.navey.co";

/**
 * A tag is a phrase people search, not a label to repeat back at them. The
 * wording differs by group so the page reads like an answer rather than a
 * database row: somewhere with a rooftop, somewhere that serves pastries.
 */
function headline(label: string, group: string): string {
  switch (group) {
    case "Food & Drink":
      return `Where to find ${label} in the Philippines`;
    case "Setting":
      return `${label} coffee shops and restaurants in the Philippines`;
    case "Good for":
      return `Spots that are ${label.toLowerCase()} in the Philippines`;
    default:
      return `${label} spots in the Philippines`;
  }
}

export async function generateStaticParams() {
  const directory = await getTagDirectory();
  return directory.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await findTagBySlug(slug);
  if (!tag) return { title: "Not found" };

  const title = headline(tag.label, tag.group);
  const description = `${tag.count} hand-picked ${
    tag.count === 1 ? "spot" : "spots"
  } tagged ${tag.label} across the Philippines, with photos, opening hours and directions on Navey.`;

  return {
    title,
    description,
    alternates: { canonical: `/tag/${tag.slug}` },
    openGraph: { title, description, type: "website", url: `${SITE}/tag/${tag.slug}` },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await findTagBySlug(slug);
  if (!tag) notFound();

  const [spots, directory] = await Promise.all([
    getApprovedSpots({ tag: tag.label }),
    getTagDirectory(),
  ]);

  // Where this actually exists, so someone in Cebu is not scrolling a list of
  // Taguig spots to work out none of them are near them.
  const cityCounts = new Map<string, number>();
  for (const spot of spots) {
    cityCounts.set(spot.city, (cityCounts.get(spot.city) ?? 0) + 1);
  }
  const cities = [...cityCounts.entries()].sort((a, b) => b[1] - a[1]);

  const related = directory
    .filter((entry) => entry.group === tag.group && entry.slug !== tag.slug)
    .slice(0, 8);

  const title = headline(tag.label, tag.group);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: title,
        url: `${SITE}/tag/${tag.slug}`,
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
            name: tag.label,
            item: `${SITE}/tag/${tag.slug}`,
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
          <Link href="/explore" className="hover:text-navey-ink">
            Explore
          </Link>{" "}
          › <span className="text-navey-ink">{tag.label}</span>
        </nav>

        <h1 className="flex items-center gap-3 font-heading text-3xl font-extrabold sm:text-4xl">
          {tag.icon && <span aria-hidden>{tag.icon}</span>}
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium text-navey-ink/70">
          {spots.length} {spots.length === 1 ? "spot" : "spots"} tagged{" "}
          {tag.label}
          {cities.length > 0 && (
            <>
              {" "}
              across{" "}
              {cities
                .slice(0, 3)
                .map(([city]) => city)
                .join(", ")}
              {cities.length > 3 ? " and more" : ""}
            </>
          )}
          , each one visited and written up rather than scraped from a directory.
        </p>

        {cities.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {cities.map(([city, count]) => (
              <Link
                key={city}
                href={`/city/${citySlug(city)}`}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-[0_4px_12px_rgba(20,18,11,0.06)] transition-transform hover:-translate-y-0.5"
              >
                {city}
                <span className="ml-1.5 text-navey-ink/40">{count}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {spots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              showSaveButton
            />
          ))}
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="font-heading text-xl font-extrabold">
              More under {tag.group}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {related.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/tag/${entry.slug}`}
                  className="flex items-center gap-2 rounded-full bg-navey-band px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:bg-navey-ink hover:text-navey-yellow"
                >
                  {entry.icon && <span aria-hidden>{entry.icon}</span>}
                  {entry.label}
                  <span className="opacity-45">{entry.count}</span>
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
