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
  getTags,
} from "@/lib/queries";
import { getSavedSpotIds } from "@/lib/profile";
import { getCityDirectory } from "@/lib/cities";

export const dynamic = "force-dynamic";

const TAG_ICON: Record<string, string> = {
  wifi: "📶",
  clock: "🕐",
  gem: "💎",
  sofa: "🛋️",
  heart: "❤️",
  plug: "🔌",
  laptop: "💻",
  paw: "🐾",
  restroom: "🚻",
  accessibility: "♿",
};

export default async function Home() {
  const [spots, collections, tags, featured, savedSpotIds, cities] =
    await Promise.all([
      getApprovedSpots({ limit: 8 }),
      getCollections(4),
      getTags(),
      getFeaturedSpots(5),
      getSavedSpotIds(),
      getCityDirectory(),
    ]);

  // Only spots people have actually saved belong under "Community Picks";
  // an empty box announcing it has nothing reads worse than no section.
  const communityPicks = (
    await getApprovedSpots({ sort: "most_saved", limit: 5 })
  ).filter((spot) => spot.saveCount > 0);


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
        <Hero featured={featured} savedSpotIds={[...savedSpotIds]} />

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
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/explore?tags=${encodeURIComponent(tag.label)}`}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:bg-navey-ink hover:text-navey-yellow active:scale-95"
              >
                <span aria-hidden>{(tag.icon && TAG_ICON[tag.icon]) ?? "✨"}</span>
                {tag.label}
              </Link>
            ))}
            <Link
              href="/explore"
              className="flex items-center gap-2 rounded-full bg-navey-ink px-4 py-2 text-sm font-semibold text-navey-yellow hover:bg-navey-ink/80"
            >
              View All
            </Link>
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
                  saved={savedSpotIds.has(spot.id)}
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
