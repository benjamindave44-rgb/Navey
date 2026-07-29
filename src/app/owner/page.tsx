import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getOwnerSpots, getOwnerSpotStats } from "@/lib/owner";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function OwnerPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const [spots, stats] = await Promise.all([
    getOwnerSpots(user.id),
    getOwnerSpotStats(user.id),
  ]);

  const totals = [...stats.values()].reduce(
    (sum, stat) => ({
      saves: sum.saves + stat.saveCount,
      reviews: sum.reviews + stat.reviewCount,
    }),
    { saves: 0, reviews: 0 }
  );

  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-3xl font-extrabold">
            Owner Dashboard
          </h1>
          <p className="mt-2 text-sm text-navey-ink/60">
            Manage the spots you&apos;ve submitted to Navey.
          </p>

          {spots.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white p-4 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
                <p className="font-heading text-2xl font-extrabold">
                  {spots.length}
                </p>
                <p className="text-xs font-semibold text-navey-ink/55">
                  {spots.length === 1 ? "Spot" : "Spots"}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
                <p className="font-heading text-2xl font-extrabold">
                  {totals.saves}
                </p>
                <p className="text-xs font-semibold text-navey-ink/55">Saves</p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
                <p className="font-heading text-2xl font-extrabold">
                  {totals.reviews}
                </p>
                <p className="text-xs font-semibold text-navey-ink/55">Reviews</p>
              </div>
            </div>
          )}

          {spots.length === 0 ? (
            <div className="mt-10 flex flex-col items-start gap-3">
              <p className="text-sm text-navey-ink/60">
                You haven&apos;t submitted any spots yet.
              </p>
              <Link
                href="/submit-a-spot"
                className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
              >
                Submit a Spot
              </Link>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-3">
              {spots.map((spot) => (
                <Link
                  key={spot.id}
                  href={`/owner/${spot.id}`}
                  className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-heading font-bold">{spot.name}</p>
                      <p className="text-sm text-navey-ink/60">{spot.city}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {spot.needsReview && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Flagged
                        </span>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          STATUS_STYLE[spot.status] ?? "bg-navey-band text-navey-ink"
                        }`}
                      >
                        {spot.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-navey-ink/70">
                    <span>♥ {stats.get(spot.id)?.saveCount ?? 0} saves</span>
                    <span>
                      ★{" "}
                      {stats.get(spot.id)?.averageRating?.toFixed(1) ?? "—"}
                      {" · "}
                      {stats.get(spot.id)?.reviewCount ?? 0} review
                      {stats.get(spot.id)?.reviewCount === 1 ? "" : "s"}
                    </span>
                    <span>📷 {stats.get(spot.id)?.galleryPhotos ?? 0} photos</span>
                  </div>

                  {/* Something the owner can act on beats a number they can't move. */}
                  {(stats.get(spot.id)?.missing.length ?? 0) > 0 && (
                    <p className="rounded-xl bg-navey-band px-3 py-2 text-xs font-semibold text-navey-ink/75">
                      Listing still needs {stats.get(spot.id)!.missing.join(", ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
