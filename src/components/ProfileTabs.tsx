"use client";

import Link from "next/link";
import { useState } from "react";
import { createSavedList } from "@/app/profile/actions";
import type { ProfileData } from "@/lib/profile";

const BADGES = [
  { icon: "💎", name: "Gem Hunter", description: "Find and save 5 hidden gems" },
  { icon: "✍️", name: "Reviewer", description: "Write 5 reviews" },
  { icon: "📍", name: "Contributor", description: "Get a submitted spot approved" },
  { icon: "🗺️", name: "Explorer", description: "Save spots in 3 different cities" },
  { icon: "⭐", name: "Trusted Voice", description: "Get 10 helpful votes on a review" },
  { icon: "🎉", name: "Founding Member", description: "Joined during Navey's early days" },
];

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

type Tab = "lists" | "reviews" | "badges" | "contributions";

export function ProfileTabs({ profile }: { profile: ProfileData }) {
  const [tab, setTab] = useState<Tab>("lists");
  const [showNewList, setShowNewList] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: "lists", label: "Saved Lists" },
    { id: "reviews", label: "Reviews" },
    { id: "badges", label: "Badges" },
    { id: "contributions", label: "Contributions" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-black/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-semibold ${
              tab === t.id
                ? "border-b-2 border-navey-ink text-navey-ink"
                : "text-navey-ink/50 hover:text-navey-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="py-8">
        {tab === "lists" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profile.savedLists.map((list) => (
              <div
                key={list.id}
                className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
              >
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-navey-band text-3xl">
                  🗺️
                </div>
                <p className="font-heading font-bold">{list.name}</p>
                <div className="flex items-center justify-between text-sm text-navey-ink/60">
                  <span>
                    {list.spotCount} spot{list.spotCount === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-full bg-navey-band px-3 py-1 text-xs font-semibold">
                    {list.isPublic ? "Public" : "Private"}
                  </span>
                </div>
              </div>
            ))}

            {showNewList ? (
              <form
                action={createSavedList}
                className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-black/20 p-4"
              >
                <input
                  type="text"
                  name="name"
                  placeholder="List name"
                  required
                  className="rounded-full border border-black/10 px-4 py-2 text-sm outline-none focus:border-navey-ink"
                />
                <label className="flex items-center gap-2 text-sm text-navey-ink/70">
                  <input type="checkbox" name="isPublic" />
                  Make this list public
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-full bg-navey-ink px-4 py-2 text-sm font-bold text-navey-yellow"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewList(false)}
                    className="rounded-full bg-navey-band px-4 py-2 text-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewList(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/20 p-8 text-navey-ink/50 hover:border-navey-ink hover:text-navey-ink"
              >
                <span className="text-2xl" aria-hidden>
                  +
                </span>
                New list
              </button>
            )}
          </div>
        )}

        {tab === "reviews" && (
          <div className="flex flex-col gap-4">
            {profile.reviews.length === 0 ? (
              <p className="text-sm text-navey-ink/60">
                No reviews yet — visit a spot&apos;s page to write one.
              </p>
            ) : (
              profile.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/spots/${review.spotId}`}
                      className="font-heading font-bold hover:opacity-60"
                    >
                      {review.spotName}
                    </Link>
                    <span aria-label={`${review.rating} out of 5 stars`}>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-navey-ink/50">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  {review.body && (
                    <p className="mt-2 text-sm text-navey-ink/80">{review.body}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "badges" && (
          <div>
            <p className="mb-4 text-sm text-navey-ink/60">
              Badge tracking is coming soon — here&apos;s what you&apos;ll be able
              to earn.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BADGES.map((badge) => (
                <div
                  key={badge.name}
                  className="flex flex-col gap-2 rounded-2xl bg-white p-4 opacity-40 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
                >
                  <span className="text-3xl" aria-hidden>
                    {badge.icon}
                  </span>
                  <p className="font-heading font-bold">{badge.name}</p>
                  <p className="text-xs text-navey-ink/60">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "contributions" && (
          <div className="flex flex-col gap-3">
            {profile.contributions.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
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
              profile.contributions.map((spot) => (
                <div
                  key={spot.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
                >
                  <div>
                    <p className="font-heading font-bold">{spot.name}</p>
                    <p className="text-sm text-navey-ink/60">{spot.city}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      STATUS_STYLE[spot.status] ?? "bg-navey-band text-navey-ink"
                    }`}
                  >
                    {spot.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
