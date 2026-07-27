import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCollections } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Curated guides to the best coffee shops and restaurants across the Philippines.",
};

export default async function CollectionsPage() {
  const collections = await getCollections(50);

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-10 sm:px-6 md:px-12 md:py-12">
        <h1 className="font-heading text-3xl font-extrabold">Collections</h1>
        <p className="mt-2 text-sm text-navey-ink/60">
          Curated guides to spots worth the trip.
        </p>

        {collections.length === 0 ? (
          <p className="mt-10 text-sm text-navey-ink/60">
            No collections yet — check back soon.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
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
                <div className="flex flex-col gap-1 p-3 sm:p-4">
                  <p className="font-heading text-sm font-bold sm:text-base">
                    {collection.title}
                  </p>
                  {collection.description && (
                    <p className="line-clamp-2 text-xs text-navey-ink/60 sm:text-sm">
                      {collection.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
