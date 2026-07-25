import Link from "next/link";
import { backfillCoordinates } from "@/app/admin/actions";
import {
  getAdminOverviewStats,
  getMissingCoordinatesCount,
  getPendingClaimsCount,
} from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;

  const [stats, missingCoords, pendingClaims] = await Promise.all([
    getAdminOverviewStats(),
    getMissingCoordinatesCount(),
    getPendingClaimsCount(),
  ]);
  const needsAttention = stats.pendingSpots + stats.flaggedSpots;
  const maxCityCount = Math.max(...stats.spotsByCity.map((c) => c.count), 1);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-3xl font-extrabold">Overview</h1>

      {notice && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </p>
      )}

      {missingCoords > 0 && (
        <form
          action={backfillCoordinates}
          className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-navey-band px-5 py-4 text-sm font-semibold"
        >
          <span>
            {missingCoords} spot{missingCoords === 1 ? "" : "s"} missing map
            coordinates — they won&apos;t show up as pins on the Explore Map.
          </span>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-navey-ink px-4 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
          >
            Fill In Coordinates
          </button>
        </form>
      )}

      {needsAttention > 0 && (
        <Link
          href="/admin/review-queue"
          className="mt-4 flex items-center justify-between rounded-2xl bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800 hover:bg-amber-100"
        >
          <span>
            {needsAttention} item{needsAttention === 1 ? "" : "s"} need
            {needsAttention === 1 ? "s" : ""} your attention (
            {stats.pendingSpots} pending, {stats.flaggedSpots} flagged)
          </span>
          <span aria-hidden>→</span>
        </Link>
      )}

      {pendingClaims > 0 && (
        <Link
          href="/admin/claims"
          className="mt-4 flex items-center justify-between rounded-2xl bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800 hover:bg-amber-100"
        >
          <span>
            {pendingClaims} business claim{pendingClaims === 1 ? "" : "s"}{" "}
            waiting for review
          </span>
          <span aria-hidden>→</span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Live Spots" value={stats.approvedSpots} />
        <StatCard label="Pending Review" value={stats.pendingSpots} />
        <StatCard label="Flagged" value={stats.flaggedSpots} />
        <StatCard label="Explorers" value={stats.totalUsers} />
        <StatCard label="Reviews" value={stats.totalReviews} />
        <StatCard label="Collections" value={stats.totalCollections} />
        <StatCard label="Total Saves" value={stats.totalSaves} />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-extrabold">Spots by City</h2>
        {stats.spotsByCity.length === 0 ? (
          <p className="mt-3 text-sm text-navey-ink/60">
            No approved spots yet.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {stats.spotsByCity.map((row) => (
              <div key={row.city} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm font-semibold">
                  {row.city}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-navey-band">
                  <div
                    className="h-full rounded-full bg-navey-ink"
                    style={{ width: `${(row.count / maxCityCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm text-navey-ink/60">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
      <p className="font-heading text-2xl font-extrabold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-navey-ink/50">
        {label}
      </p>
    </div>
  );
}
