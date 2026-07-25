import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getOwnerSpots } from "@/lib/owner";
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

  const spots = await getOwnerSpots(user.id);

  return (
    <>
      <Header />
      <main className="flex-1 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-3xl font-extrabold">
            Owner Dashboard
          </h1>
          <p className="mt-2 text-sm text-navey-ink/60">
            Manage the spots you&apos;ve submitted to Navey.
          </p>

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
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)] transition-transform hover:-translate-y-0.5"
                >
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
