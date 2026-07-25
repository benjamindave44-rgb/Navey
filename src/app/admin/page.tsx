import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { approveSpot, rejectSpot } from "@/app/admin/actions";
import { getPendingSpots } from "@/lib/admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  coffee_shop: "Coffee Shop",
  restaurant: "Restaurant",
  both: "Coffee Shop & Restaurant",
};

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/");

  const pendingSpots = await getPendingSpots();

  return (
    <>
      <Header />
      <main className="flex-1 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-heading text-3xl font-extrabold">Review Queue</h1>
          <p className="mt-2 text-sm text-navey-ink/60">
            {pendingSpots.length} spot{pendingSpots.length === 1 ? "" : "s"}{" "}
            waiting for review
          </p>

          {pendingSpots.length === 0 ? (
            <p className="mt-10 text-sm text-navey-ink/60">
              Nothing pending — you&apos;re all caught up.
            </p>
          ) : (
            <div className="mt-8 flex flex-col gap-4">
              {pendingSpots.map((spot) => (
                <div
                  key={spot.id}
                  className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-heading text-lg font-bold">
                        {spot.name}
                      </p>
                      <p className="text-sm text-navey-ink/60">
                        {spot.address}, {spot.city}
                        {spot.province ? `, ${spot.province}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-navey-ink/50">
                        {CATEGORY_LABEL[spot.category] ?? spot.category} ·{" "}
                        {spot.priceRange ?? "no price set"} · submitted by{" "}
                        {spot.submitterName ?? "unknown"} on{" "}
                        {new Date(spot.createdAt).toLocaleDateString()}
                      </p>
                      {spot.description && (
                        <p className="mt-2 max-w-xl text-sm text-navey-ink/80">
                          {spot.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <form action={approveSpot}>
                        <input type="hidden" name="id" value={spot.id} />
                        <button
                          type="submit"
                          className="rounded-full bg-navey-ink px-4 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={rejectSpot}>
                        <input type="hidden" name="id" value={spot.id} />
                        <button
                          type="submit"
                          className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
