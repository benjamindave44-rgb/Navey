import Link from "next/link";
import { getAdminSpotList } from "@/lib/admin";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

function firstParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const search = firstParam(query.q);
  const status = firstParam(query.status);
  const notice = typeof query.notice === "string" ? query.notice : undefined;

  const spots = await getAdminSpotList({ search, status });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-extrabold">
          Manage Listings
        </h1>
        <Link
          href="/admin/listings/new"
          className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
        >
          + Add Spot
        </Link>
      </div>
      <p className="mt-2 text-sm text-navey-ink/60">
        {spots.length} spot{spots.length === 1 ? "" : "s"}
      </p>

      {notice && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </p>
      )}

      <form className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Search by name or city..."
          className="min-w-[200px] flex-1 rounded-full bg-white px-4 py-2 text-base sm:text-sm shadow-[0_8px_24px_rgba(20,18,11,0.08)] outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-full bg-white px-4 py-2 text-base sm:text-sm shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow"
        >
          Search
        </button>
      </form>

      {spots.length === 0 ? (
        <p className="mt-10 text-sm text-navey-ink/60">No spots found.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,18,11,0.05)]">
          {spots.map((spot) => (
            <Link
              key={spot.id}
              href={`/admin/listings/${spot.id}`}
              className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-3.5 last:border-b-0 hover:bg-navey-band/30"
            >
              <div>
                <p className="font-heading text-sm font-bold">{spot.name}</p>
                <p className="text-xs text-navey-ink/55">{spot.city}</p>
              </div>
              <div className="flex items-center gap-2">
                {spot.featured && (
                  <span className="rounded-full bg-navey-ink px-2.5 py-1 text-xs font-bold text-navey-yellow">
                    Featured
                  </span>
                )}
                {spot.needsReview && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                    Flagged
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                    STATUS_BADGE[spot.status] ?? "bg-navey-band text-navey-ink"
                  }`}
                >
                  {spot.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
