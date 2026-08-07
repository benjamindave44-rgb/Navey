import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { SpotCard } from "@/components/SpotCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import {
  getApprovedSpots,
  getCollections,
  getFeaturedSpots,
} from "@/lib/queries";
import { getCityDirectory } from "@/lib/cities";
import { getTagDirectory } from "@/lib/tags";

// Built once and shared rather than rebuilt for every visitor. Nothing on the
// page differs between people any more: the header's account controls and the
// saved hearts both resolve in the browser. Five minutes is the longest a
// newly approved listing waits to appear here.
export const revalidate = 300;


export default async function Home() {
  // One pass over the listings, not two. Both sections below are slices of
  // the same set, and fetching it twice meant every homepage view pulled every
  // spot -- with its tags, photos and hours -- across the wire a second time
  // to reorder rows already in memory.
  const [allSpots, collections, tags, featured, cities] =
    await Promise.all([
      getApprovedSpots({}),
      getCollections(4),
      getTagDirectory(),
      getFeaturedSpots(5),
      getCityDirectory(),
    ]);

  const spots = allSpots.slice(0, 8);

  // Only spots people have actually saved belong under "Community Picks";
  // an empty box announcing it has nothing reads worse than no section.
  const communityPicks = [...allSpots]
    .filter((spot) => spot.saveCount > 0)
    .sort((a, b) => b.saveCount - a.saveCount)
    .slice(0, 5);


  // Tells Google what Navey is as an organisation, not just what each spot
  // is. This is what lets a brand search show a logo and sitelinks rather
  // than a bare blue link, and it can only be declared on the homepage.
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.navey.co/#organization",
        name: "Navey",
        url: "https://www.navey.co",
        logo: "https://www.navey.co/navey-icon.png",
        description:
          "A guide to coffee shops and restaurants worth the trip across the Philippines.",
        email: "navey.ph@gmail.com",
        areaServed: { "@type": "Country", name: "Philippines" },
      },
      {
        "@type": "WebSite",
        "@id": "https://www.navey.co/#website",
        url: "https://www.navey.co",
        name: "Navey",
        publisher: { "@id": "https://www.navey.co/#organization" },
        inLanguage: "en-PH",
        // Lets Google offer a search box for Navey directly in results.
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://www.navey.co/explore?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      <Header />
      <main id="main" className="flex-1">
        <Hero featured={featured} />

        <section className="px-4 py-10 sm:px-6 md:px-12 md:py-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-navey-ink/50">
                Curated for you
              </p>
              <h2 className="font-heading text-2xl font-extrabold">
                Curated Collections
              </h2>
            </div>
            <Link
              href="/collections"
              className="text-sm font-semibold hover:opacity-60"
            >
              View all
            </Link>
          </div>
          {collections.length === 0 ? (
            <p className="text-sm text-navey-ink/60">
              No collections yet — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className="navey-arch-card group flex flex-col overflow-hidden bg-white shadow-[0_8px_24px_rgba(20,18,11,0.08)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(20,18,11,0.14)] active:scale-[0.98]"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center bg-navey-band text-4xl">
                    <span className="transition-transform duration-500 group-hover:scale-110">
                      🗺️
                    </span>
                    <span className="absolute bottom-3 left-3 rounded-full bg-navey-ink px-3 py-1 text-xs font-bold text-navey-yellow">
                      {collection.spotCount} spots
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <p className="font-heading font-bold">{collection.title}</p>
                    <p className="text-sm text-navey-ink/60">Philippines</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-navey-band px-4 py-10 sm:px-6 md:px-12 md:py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-extrabold">
              Trending Nearby
            </h2>
            <Link href="/explore" className="text-sm font-semibold hover:opacity-60">
              View all
            </Link>
          </div>
          {spots.length === 0 ? (
            <p className="text-sm text-navey-ink/60">
              No approved spots yet — submit one to get started.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-5">
              {spots.map((spot) => (
                <SpotCard key={spot.id} spot={spot} trending />
              ))}
            </div>
          )}
        </section>

        {/* Left on the canvas so the cream bands either side of it stay
            distinct. Three banded sections running together read as one long
            block once the page behind them is no longer yellow. */}
        <section className="px-4 py-10 sm:px-6 md:px-12 md:py-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-extrabold">
              Browse by Vibe
            </h2>
            <Link
              href="/onboarding"
              className="flex items-center gap-2 rounded-full bg-navey-ink px-4 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
            >
              Take the Vibe Quiz →
            </Link>
          </div>
          {/* Grouped rather than one long row: thirty-odd chips in a single
              line is a wall people skim past, and the group names tell you
              what kind of thing you are choosing between. */}
          <div className="flex flex-col gap-5">
            {[...new Map(tags.map((tag) => [tag.group, tags.filter((t) => t.group === tag.group)])).entries()].map(
              ([group, list]) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navey-ink/45">
                    {group}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {list.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/tag/${tag.slug}`}
                        // Without this, every chip on screen quietly renders
                        // its whole page on the server before anyone clicks
                        // it -- forty pages built to serve one. Chips are
                        // cheap to open on demand; prefetching them is not.
                        prefetch={false}
                        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-[0_4px_12px_rgba(20,18,11,0.05)] transition-transform hover:-translate-y-0.5 hover:bg-navey-ink hover:text-navey-yellow active:scale-95"
                      >
                        {tag.icon && <span aria-hidden>{tag.icon}</span>}
                        {tag.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {communityPicks.length > 0 && (
          <section className="bg-navey-band px-4 py-10 sm:px-6 md:px-12 md:py-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-navey-ink/50">
                  Most saved by explorers
                </p>
                <h2 className="font-heading text-2xl font-extrabold">
                  Community Picks
                </h2>
              </div>
              <Link
                href="/community"
                className="text-sm font-semibold hover:opacity-60"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-5">
              {communityPicks.map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  showSaveButton
                />
              ))}
            </div>
          </section>
        )}

        {/* Every city page needs a real link from the site, not just a line in
            the sitemap -- crawlers weight what is linked, and so do people. */}
        {cities.length > 0 && (
          <section className="bg-navey-band px-4 py-10 sm:px-6 md:px-12 md:py-12">
            <div className="mb-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-navey-ink/50">
                Where to look
              </p>
              <h2 className="font-heading text-2xl font-extrabold">
                Browse by City
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/city/${city.slug}`}
                  prefetch={false}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:bg-navey-ink hover:text-navey-yellow active:scale-95"
                >
                  {city.city}
                  <span className="opacity-45">{city.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="bg-navey-yellow px-4 py-10 sm:px-6 md:px-12 md:py-12">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-extrabold">
                Get the weekly drop
              </h2>
              <p className="text-sm font-medium text-navey-ink/70">
                New spots and hidden gems, straight to your inbox.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
