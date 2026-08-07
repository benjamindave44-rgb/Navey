import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getLeaderboard } from "@/lib/community";

// Built once and shared, rather than rebuilt for each visitor. Nothing on
// this page differs between people -- the account controls in the header
// resolve in the browser -- so a per-visitor rebuild bought nothing and cost
// a page render every time. Five minutes is the longest anyone waits to see
// a newly approved listing here; publishing from the admin panel refreshes
// the affected pages at once regardless.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Top explorers on Navey, ranked by reviews written, spots saved, and hidden gems found.",
  alternates: { canonical: "/leaderboard" },
};

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_MARGIN = ["", "mt-6", "mt-9"];

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard(10);
  const showPodium = entries.length >= 3;
  const podium = showPodium ? entries.slice(0, 3) : [];
  const rest = showPodium ? entries.slice(3) : entries;
  const podiumRenderOrder = [1, 0, 2];

  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-navey-ink/50">
            Community
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold">
            Top Explorers
          </h1>
          <p className="mt-2 text-sm text-navey-ink/60">
            Ranked by spots saved, reviews written, and hidden gems found.
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="mx-auto mt-16 max-w-md text-center">
            <p className="text-4xl" aria-hidden>
              🏆
            </p>
            <p className="mt-4 text-sm text-navey-ink/60">
              No activity yet — save a spot, write a review, or submit a
              hidden gem to be the first on the board.
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-3xl">
            {showPodium && (
              <div className="grid grid-cols-3 items-end gap-4">
                {podiumRenderOrder.map((i) => {
                  const entry = podium[i];
                  return (
                    <div key={entry.id} className={PODIUM_MARGIN[i]}>
                      <Link
                        href={`/u/${entry.id}`}
                        className="block rounded-2xl bg-white p-5 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)] transition-transform hover:-translate-y-1"
                      >
                        <p className="text-2xl" aria-hidden>
                          {MEDALS[i]}
                        </p>
                        <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-navey-yellow bg-navey-ink text-lg font-bold text-navey-yellow">
                          {initials(entry.name)}
                        </div>
                        <p className="mt-2 font-heading text-sm font-bold">
                          {entry.name}
                        </p>
                        <p className="text-xs text-navey-ink/55">
                          {entry.points} pts
                        </p>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {rest.length > 0 && (
              <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,18,11,0.05)]">
                {rest.map((entry, index) => (
                  <Link
                    key={entry.id}
                    href={`/u/${entry.id}`}
                    className="flex items-center gap-4 border-b border-black/5 px-5 py-3.5 last:border-b-0 hover:bg-navey-band/40"
                  >
                    <span className="w-6 font-heading text-sm font-extrabold text-navey-ink/40">
                      {index + (showPodium ? 4 : 1)}
                    </span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navey-band text-sm font-bold">
                      {initials(entry.name)}
                    </div>
                    <div className="flex-1">
                      <p className="font-heading text-sm font-bold">
                        {entry.name}
                      </p>
                      <p className="text-xs text-navey-ink/50">{entry.badge}</p>
                    </div>
                    <p className="text-sm font-bold">{entry.points} pts</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <Link href="/explore" className="text-sm font-bold hover:opacity-60">
            ← Back to Explore
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
