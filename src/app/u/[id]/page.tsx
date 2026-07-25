import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getPublicProfile } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) return { title: "Explorer not found" };

  return {
    title: profile.displayName,
    description: `${profile.displayName}'s reviews, saved lists, and spots on Navey.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === id) redirect("/profile");

  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  const initial = profile.displayName.trim().charAt(0).toUpperCase() || "?";
  const joined = new Date(profile.joinedAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const stats: { label: string; value: number }[] = [
    { label: "Saved", value: profile.stats.spotsSaved },
    { label: "Reviews", value: profile.stats.reviewsCount },
    { label: "Gems", value: profile.stats.hiddenGemsFound },
    { label: "Lists", value: profile.stats.listsCreated },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-navey-ink text-2xl font-bold text-navey-yellow shadow-[0_6px_16px_rgba(20,18,11,0.1)]">
              {initial}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-2xl font-extrabold">
                  {profile.displayName}
                </h1>
                <span className="rounded-full bg-navey-ink px-2.5 py-1 text-[11px] font-extrabold text-navey-yellow">
                  {profile.badge}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-navey-ink/55">Joined {joined}</p>
            </div>
          </div>

          <div className="mt-7 flex gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-2xl bg-white p-4 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
              >
                <p className="font-heading text-xl font-extrabold">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-navey-ink/55">{stat.label}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-9 font-heading text-lg font-bold">Public lists</h2>
          {profile.publicLists.length === 0 ? (
            <p className="mt-3 text-sm text-navey-ink/55">
              No public lists yet.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {profile.publicLists.map((list) => (
                <div
                  key={list.id}
                  className="rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(20,18,11,0.06)]"
                >
                  <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-navey-band text-2xl">
                    🗺️
                  </div>
                  <p className="mt-2.5 font-heading text-sm font-bold">
                    {list.name}
                  </p>
                  <p className="text-xs text-navey-ink/55">
                    {list.spotCount} spot{list.spotCount === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
            </div>
          )}

          <h2 className="mt-9 font-heading text-lg font-bold">
            Recent reviews
          </h2>
          {profile.reviews.length === 0 ? (
            <p className="mt-3 text-sm text-navey-ink/55">No reviews yet.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {profile.reviews.slice(0, 6).map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(20,18,11,0.06)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/spots/${review.spotId}`}
                      className="font-heading text-sm font-bold hover:opacity-60"
                    >
                      {review.spotName}
                    </Link>
                    <span aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          aria-hidden
                          className={
                            i < review.rating
                              ? "text-amber-400"
                              : "text-navey-ink/20"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-navey-ink/50">
                    {timeAgo(review.createdAt)}
                  </p>
                  {review.body && (
                    <p className="mt-2 text-sm text-navey-ink/75">
                      {review.body}
                    </p>
                  )}
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
