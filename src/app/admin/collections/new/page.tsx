import Link from "next/link";
import { createCollection } from "@/app/admin/collections/actions";

export const dynamic = "force-dynamic";

export default async function NewCollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/collections" className="text-sm font-semibold hover:opacity-60">
        ← Collections
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-extrabold">New Collection</h1>
      <p className="mt-2 text-sm text-navey-ink/60">
        Give it a title now; you&apos;ll pick the spots next.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createCollection} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-sm font-semibold">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Best Work-Friendly Cafés in BGC"
            className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-semibold">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="What ties these spots together?"
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
        >
          Create Collection
        </button>
      </form>
    </div>
  );
}
