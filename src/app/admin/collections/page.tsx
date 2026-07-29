import Link from "next/link";
import { getAdminCollections } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;
  const collections = await getAdminCollections();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-extrabold">Collections</h1>
        <Link
          href="/admin/collections/new"
          className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
        >
          + New Collection
        </Link>
      </div>
      <p className="mt-2 text-sm text-navey-ink/60">
        Curated guides shown on the homepage and at /collections.
      </p>

      {notice && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </p>
      )}

      {collections.length === 0 ? (
        <p className="mt-10 text-sm text-navey-ink/60">
          No collections yet — create one to fill the homepage section.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,18,11,0.05)]">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/admin/collections/${collection.id}`}
              className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-3.5 last:border-b-0 hover:bg-navey-band/30"
            >
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold">{collection.title}</p>
                {collection.description && (
                  <p className="truncate text-xs text-navey-ink/55">
                    {collection.description}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                  collection.spotCount === 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-navey-band text-navey-ink"
                }`}
              >
                {collection.spotCount} spot{collection.spotCount === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
