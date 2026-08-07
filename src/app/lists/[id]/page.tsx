import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotCard } from "@/components/SpotCard";
import { getSpotsByIds } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * The spots on a saved list.
 *
 * Saving worked and the lists were counted on the profile, but there was
 * nowhere to open one -- the cards were plain boxes, and no page existed
 * behind them. Saving somewhere you cannot look at is not saving.
 *
 * Deliberately not cached, and never will be: what comes back depends on who
 * is asking. Private lists are readable only by their owner, and that is
 * enforced by the database rather than checked here, so there is no way for
 * this page to forget it.
 */
export const dynamic = "force-dynamic";

// A person's own collection of places, not something that should turn up in
// search results. Public only means "shareable by link" here.
export const metadata: Metadata = {
  title: "Saved list",
  robots: { index: false, follow: false },
};

export default async function SavedListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Reading as whoever is asking. A private list belonging to someone else
  // simply is not there, which is the answer we want anyway.
  const { data: list } = await supabase
    .from("saved_lists")
    .select("id, name, is_public, user_id, saved_list_spots(spot_id)")
    .eq("id", id)
    .maybeSingle();

  if (!list) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === list.user_id;

  const spots = await getSpotsByIds(
    supabase,
    list.saved_list_spots.map((row) => row.spot_id)
  );

  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-4 py-10 sm:px-6 md:px-12">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs font-semibold text-navey-ink/50">
          <Link href="/" className="hover:text-navey-ink">
            Navey
          </Link>{" "}
          ›{" "}
          {isOwner ? (
            <Link href="/profile" className="hover:text-navey-ink">
              Your lists
            </Link>
          ) : (
            <span>Saved list</span>
          )}{" "}
          › <span className="text-navey-ink">{list.name}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">
            {list.name}
          </h1>
          <span className="rounded-full bg-navey-band px-3 py-1 text-xs font-semibold">
            {list.is_public ? "Public" : "Private"}
          </span>
        </div>
        <p className="mt-3 text-sm font-medium text-navey-ink/70">
          {spots.length} {spots.length === 1 ? "spot" : "spots"}
        </p>

        {spots.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl" aria-hidden>
              🤍
            </span>
            <h2 className="font-heading text-xl font-extrabold">
              Nothing saved here yet
            </h2>
            <p className="max-w-sm text-sm text-navey-ink/60">
              Tap the heart on any spot to keep it here for later.
            </p>
            <Link
              href="/explore"
              className="mt-2 rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
            >
              Find spots
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} showSaveButton />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
