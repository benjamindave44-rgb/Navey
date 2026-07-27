import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { SpotCard } from "@/components/SpotCard";
import { getApprovedSpots, getCollections, getTags } from "@/lib/queries";

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
  const [spots, collections, tags] = await Promise.all([
    getApprovedSpots({ limit: 8 }),
    getCollections(4),
    getTags(),
  ]);

  const featured = spots.find((spot) => spot.hidden_gem) ?? spots[0] ?? null;

  return (
    <>
      <Header />
      <main className="flex-1">
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
            <span className="text-sm font-semibold text-navey-ink/40">
              View all
            </span>
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
                  className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(20,18,11,0.08)] transition-transform hover:-translate-y-1"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center bg-navey-band text-4xl">
                    🗺️
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
            <div className="flex items-center gap-4">
              <Link href="/explore" className="text-sm font-semibold hover:opacity-60">
                View all
              </Link>
              <button
                type="button"
                aria-label="Next"
                disabled
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm disabled:cursor-not-allowed"
              >
                <span aria-hidden>→</span>
              </button>
            </div>
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

        <section className="bg-navey-band px-4 py-10 sm:px-6 md:px-12 md:py-12">
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
              <span
                key={tag.id}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold"
              >
                <span aria-hidden>{(tag.icon && TAG_ICON[tag.icon]) ?? "✨"}</span>
                {tag.label}
              </span>
            ))}
            <Link
              href="/explore"
              className="flex items-center gap-2 rounded-full bg-navey-ink px-4 py-2 text-sm font-semibold text-navey-yellow hover:bg-navey-ink/80"
            >
              View All
            </Link>
          </div>
        </section>

        <section className="bg-navey-band px-4 py-10 sm:px-6 md:px-12 md:py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-extrabold">
              Community Picks
            </h2>
            <button
              type="button"
              aria-label="Next"
              disabled
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm disabled:cursor-not-allowed"
            >
              <span aria-hidden>→</span>
            </button>
          </div>
          <p className="text-sm text-navey-ink/60">
            No community picks yet — reviews and saves from real explorers
            will show up here once accounts and reviews go live.
          </p>
        </section>

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
            <div className="flex w-full max-w-md items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
              <input
                type="email"
                placeholder="you@email.com"
                className="flex-1 border-none bg-transparent text-sm outline-none"
                disabled
              />
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow"
                disabled
              >
                Subscribe
                <span aria-hidden>✈️</span>
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
