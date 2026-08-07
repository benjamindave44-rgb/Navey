import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminCollectionDetail,
  getSpotsAvailableForCollection,
} from "@/lib/admin";
import {
  addSpotToCollection,
  deleteCollection,
  moveSpotInCollection,
  removeSpotFromCollection,
  updateCollection,
} from "@/app/admin/collections/actions";
import { DeleteCollectionButton } from "@/components/DeleteCollectionButton";

export const dynamic = "force-dynamic";

export default async function EditCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;
  const error = typeof query.error === "string" ? query.error : undefined;

  const [collection, available] = await Promise.all([
    getAdminCollectionDetail(id),
    getSpotsAvailableForCollection(id),
  ]);

  if (!collection) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/collections" className="text-sm font-semibold hover:opacity-60">
        ← Collections
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-extrabold">
          {collection.title}
        </h1>
        <Link
          href={`/collections/${collection.id}`}
          className="rounded-full bg-navey-band px-4 py-2 text-sm font-bold hover:bg-navey-band/70"
        >
          View Live Page
        </Link>
      </div>

      {notice && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={updateCollection} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="id" value={collection.id} />
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-sm font-semibold">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={collection.title}
            required
            className="rounded-full border border-black/10 px-4 py-3 text-base sm:text-sm outline-none focus:border-navey-ink"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-semibold">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={collection.description ?? ""}
            className="rounded-2xl border border-black/10 px-4 py-3 text-base sm:text-sm outline-none focus:border-navey-ink"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
        >
          Save Details
        </button>
      </form>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold">
          Spots in this collection
        </h2>
        <p className="mt-1 text-xs text-navey-ink/50">
          Order matters — this is the order visitors see.
        </p>

        {collection.spots.length === 0 ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No spots yet. A collection with nothing in it still shows on the
            homepage, so add a few or delete it.
          </p>
        ) : (
          <ol className="mt-4 overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,18,11,0.05)]">
            {collection.spots.map((spot, position) => (
              <li
                key={spot.id}
                className="flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-b-0"
              >
                <span className="w-6 text-sm font-bold text-navey-ink/40">
                  {position + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{spot.name}</p>
                  <p className="text-xs text-navey-ink/55">{spot.city}</p>
                </div>
                <div className="flex items-center gap-1">
                  <form action={moveSpotInCollection}>
                    <input type="hidden" name="collectionId" value={collection.id} />
                    <input type="hidden" name="spotId" value={spot.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      aria-label={`Move ${spot.name} up`}
                      disabled={position === 0}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-navey-band text-xs disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveSpotInCollection}>
                    <input type="hidden" name="collectionId" value={collection.id} />
                    <input type="hidden" name="spotId" value={spot.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      aria-label={`Move ${spot.name} down`}
                      disabled={position === collection.spots.length - 1}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-navey-band text-xs disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={removeSpotFromCollection}>
                    <input type="hidden" name="collectionId" value={collection.id} />
                    <input type="hidden" name="spotId" value={spot.id} />
                    <button
                      type="submit"
                      aria-label={`Remove ${spot.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-navey-band text-xs hover:bg-red-100"
                    >
                      ×
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-lg font-bold">Add a spot</h2>
        {available.length === 0 ? (
          <p className="mt-3 text-sm text-navey-ink/60">
            Every approved spot is already in this collection.
          </p>
        ) : (
          <form action={addSpotToCollection} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="collectionId" value={collection.id} />
            <select
              name="spotId"
              required
              className="min-w-[240px] flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-base sm:text-sm"
            >
              {available.map((spot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.name} — {spot.city}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full bg-navey-ink px-5 py-2.5 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
            >
              Add
            </button>
          </form>
        )}
      </section>

      <section className="mt-12 border-t border-black/10 pt-6">
        <form action={deleteCollection}>
          <input type="hidden" name="id" value={collection.id} />
          <DeleteCollectionButton title={collection.title} />
        </form>
        <p className="mt-2 text-xs text-navey-ink/50">
          Deleting removes the collection only — the spots inside it stay on
          Navey.
        </p>
      </section>
    </div>
  );
}
