import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotCard } from "@/components/SpotCard";
import { getCollectionDetail, getOtherCollections } from "@/lib/queries";
import { getSavedSpotIds } from "@/lib/profile";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const collection = await getCollectionDetail(id);
  if (!collection) return { title: "Collection not found" };

  const description =
    collection.description ??
    `${collection.spots.length} spot${
      collection.spots.length === 1 ? "" : "s"
    } curated by Navey. ${collection.title}.`;
  const photo = collection.coverPhotos[0]?.url;

  return {
    title: collection.title,
    description,
    alternates: { canonical: `/collections/${collection.id}` },
    openGraph: {
      title: collection.title,
      description,
      type: "website",
      images: photo ? [{ url: photo }] : undefined,
    },
  };
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const sort = firstParam(query.sort) === "most_saved" ? "most_saved" : "recommended";

  const collection = await getCollectionDetail(id, sort);
  if (!collection) notFound();

  const [otherCollections, savedSpotIds] = await Promise.all([
    getOtherCollections(collection.id, 4),
    getSavedSpotIds(),
  ]);
  const createdAgo = timeAgo(collection.createdAt);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-6 md:px-12">
          <nav className="flex items-center gap-2 text-xs font-semibold text-navey-ink/50">
            <Link href="/" className="hover:opacity-60">
              Home
            </Link>
            <span aria-hidden>/</span>
            <span>Collections</span>
            <span aria-hidden>/</span>
            <span className="text-navey-ink">{collection.title}</span>
          </nav>

          <div className="relative mt-4 flex h-[280px] flex-col justify-end overflow-hidden rounded-[28px] bg-navey-band p-6 md:h-[400px] md:p-10">
            {collection.coverPhotos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={collection.coverPhotos[0].url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-7xl">
                🗺️
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="relative flex flex-col gap-2">
              <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-navey-ink">
                {collection.spots.length} spot
                {collection.spots.length === 1 ? "" : "s"}
              </span>
              <h1 className="font-heading text-3xl font-extrabold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.4)] md:text-4xl">
                {collection.title}
              </h1>
              {collection.description && (
                <p className="line-clamp-2 max-w-lg text-sm text-white/90">
                  {collection.description}
                </p>
              )}
              <button
                type="button"
                disabled
                className="mt-2 w-fit rounded-full bg-white px-5 py-2 text-sm font-bold text-navey-ink disabled:cursor-not-allowed"
              >
                Save Collection
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-navey-ink/60">
              Curated by {collection.curatorName ?? "the Navey team"} · Created{" "}
              {createdAgo}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/collections/${collection.id}`}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  sort === "recommended"
                    ? "bg-navey-ink text-navey-yellow"
                    : "bg-navey-band"
                }`}
              >
                Recommended
              </Link>
              <Link
                href={`/collections/${collection.id}?sort=most_saved`}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  sort === "most_saved"
                    ? "bg-navey-ink text-navey-yellow"
                    : "bg-navey-band"
                }`}
              >
                Most Saved
              </Link>
            </div>
          </div>

          {collection.spots.length === 0 ? (
            <p className="mt-10 text-sm text-navey-ink/60">
              No spots in this collection yet.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {collection.spots.map((spot, index) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  rank={sort === "recommended" ? index + 1 : undefined}
                  showSaveButton
                  saved={savedSpotIds.has(spot.id)}
                  showDescription
                />
              ))}
            </div>
          )}

          {otherCollections.length > 0 && (
            <section className="mt-16 border-t border-black/5 pt-10">
              <h2 className="mb-6 font-heading text-2xl font-extrabold">
                More Collections
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {otherCollections.map((other) => (
                  <Link
                    key={other.id}
                    href={`/collections/${other.id}`}
                    className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(20,18,11,0.08)] transition-transform hover:-translate-y-1"
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center bg-navey-band text-4xl">
                      🗺️
                      <span className="absolute bottom-3 left-3 rounded-full bg-navey-ink px-3 py-1 text-xs font-bold text-navey-yellow">
                        {other.spotCount} spots
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 p-4">
                      <p className="font-heading font-bold">{other.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
