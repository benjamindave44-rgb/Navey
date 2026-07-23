import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { SpotCard } from "@/components/SpotCard";
import { getApprovedSpots, getCollections, getTags } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [spots, collections, tags] = await Promise.all([
    getApprovedSpots({ limit: 8 }),
    getCollections(4),
    getTags(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />

        <section className="px-6 py-12 md:px-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-extrabold">
              Curated Collections
            </h2>
          </div>
          {collections.length === 0 ? (
            <p className="text-sm text-navey-ink/60">
              No collections yet — check back soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-navey-band text-4xl">
                    🗺️
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <p className="font-heading font-bold">{collection.title}</p>
                    <p className="text-sm text-navey-ink/60">
                      {collection.spotCount} spots
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-navey-band px-6 py-12 md:px-12">
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {spots.map((spot) => (
                <SpotCard key={spot.id} spot={spot} />
              ))}
            </div>
          )}
        </section>

        <section className="bg-navey-band px-6 py-12 md:px-12">
          <h2 className="mb-6 font-heading text-2xl font-extrabold">
            Browse by Vibe
          </h2>
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold"
              >
                {tag.label}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-navey-yellow px-6 py-12 md:px-12">
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
                className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow"
                disabled
              >
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
