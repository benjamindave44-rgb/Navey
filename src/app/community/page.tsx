import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotCard } from "@/components/SpotCard";
import { getApprovedSpots } from "@/lib/queries";
import {
  getCommunityStats,
  getRecentActivity,
  getTopContributors,
  type ActivityItem,
} from "@/lib/community";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const [stats, activity, contributors, mostSaved] = await Promise.all([
    getCommunityStats(),
    getRecentActivity(10),
    getTopContributors(5),
    getApprovedSpots({ sort: "most_saved", limit: 4 }),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-navey-yellow px-6 py-12 md:px-12">
          <h1 className="font-heading text-3xl font-extrabold md:text-4xl">
            Community
          </h1>
          <p className="mt-2 max-w-xl text-sm text-navey-ink/70">
            See what fellow explorers are finding, saving, and sharing across
            the Philippines.
          </p>
          <div className="mt-6 grid max-w-md grid-cols-3 gap-4">
            <Stat label="Explorers" value={stats.explorers} />
            <Stat label="Spots Saved" value={stats.spotsSaved} />
            <Stat label="Hidden Gems Found" value={stats.hiddenGemsFound} />
          </div>
        </section>

        <section className="px-6 py-12 md:px-12">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 className="mb-4 font-heading text-xl font-extrabold">
                Recent Activity
              </h2>
              {activity.length === 0 ? (
                <p className="text-sm text-navey-ink/60">
                  No activity yet — be the first to submit a spot or create a
                  public list.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {activity.map((item) => (
                    <ActivityCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-6">
              <div className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
                <p className="mb-3 font-heading font-bold">Top Contributors</p>
                {contributors.length === 0 ? (
                  <p className="text-sm text-navey-ink/60">
                    No contributors yet — approved submissions will show up
                    here.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {contributors.map((contributor, index) => (
                      <li
                        key={contributor.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-navey-ink/40">
                            #{index + 1}
                          </span>
                          {contributor.name}
                        </span>
                        <span className="rounded-full bg-navey-band px-2 py-1 text-xs font-semibold">
                          {contributor.approvedCount} spot
                          {contributor.approvedCount === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="rounded-2xl bg-navey-ink p-5">
                <p className="font-heading font-bold text-navey-yellow">
                  Know a great spot?
                </p>
                <p className="mt-1 text-sm text-navey-yellow/70">
                  Share it with the community.
                </p>
                <Link
                  href="/submit-a-spot"
                  className="mt-3 inline-block rounded-full bg-navey-yellow px-4 py-2 text-sm font-bold text-navey-ink hover:bg-navey-yellow/80"
                >
                  Submit a Spot
                </Link>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
                <p className="font-heading font-bold">Get the weekly drop</p>
                <p className="mt-1 text-sm text-navey-ink/60">
                  New spots and hidden gems, straight to your inbox.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-full bg-navey-band px-3 py-2">
                  <input
                    type="email"
                    placeholder="you@email.com"
                    disabled
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    disabled
                    className="rounded-full bg-navey-ink px-3 py-1 text-xs font-bold text-navey-yellow disabled:cursor-not-allowed"
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-navey-band px-6 py-12 md:px-12">
          <h2 className="mb-6 font-heading text-2xl font-extrabold">
            Most Saved
          </h2>
          {mostSaved.length === 0 ? (
            <p className="text-sm text-navey-ink/60">
              No saved spots yet — check back soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {mostSaved.map((spot) => (
                <SpotCard key={spot.id} spot={spot} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
      <p className="font-heading text-2xl font-extrabold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-navey-ink/50">
        {label}
      </p>
    </div>
  );
}

function ActivityCard({ item }: { item: ActivityItem }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
      <p className="text-sm">
        <span className="font-semibold">{item.actorName}</span>{" "}
        {item.type === "submitted_spot" ? (
          <>
            submitted{" "}
            <Link
              href={`/spots/${item.spotId}`}
              className="font-semibold hover:underline"
            >
              {item.spotName}
            </Link>{" "}
            in {item.city}
          </>
        ) : (
          <>created a new list, &quot;{item.listName}&quot;</>
        )}
      </p>
      <p className="mt-1 text-xs text-navey-ink/50">
        {timeAgo(item.createdAt)}
      </p>
    </div>
  );
}
