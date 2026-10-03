"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeaturedShowcase } from "@/components/FeaturedShowcase";
import type { SpotWithTags } from "@/lib/queries";

/**
 * The headline used to rotate through a written-in list: Cebu, Baguio,
 * Siargao, Boracay, Tagaytay, Batangas, Laguna, Rizal. There is not one listing
 * in any of them. The first line of the site promised eleven destinations and
 * could deliver five, and Tagaytay is the one a crawler hammered for a day
 * precisely because it is empty.
 *
 * Someone arriving from Instagram and seeing their own city named, then finding
 * nothing there, does not come back. So the rotation now comes from the cities
 * that actually have listings -- which the homepage already fetches for the
 * directory further down the page, so this costs nothing -- and it grows by
 * itself as listings are added.
 */
const ALWAYS_TRUE = "the Philippines";

/** Enough to feel alive, few enough that each one comes round again quickly. */
const MAX_ROTATING_CITIES = 6;
const MAX_CHIPS = 6;

export function Hero({
  featured,
  savedSpotIds = [],
  cities = [],
  chips = [],
}: {
  featured: SpotWithTags[];
  savedSpotIds?: string[];
  /** Cities with at least one approved listing, busiest first. */
  cities?: string[];
  /** Tags at least one listing actually carries. */
  chips?: { label: string; slug: string; icon: string | null }[];
}) {
  // "the Philippines" leads because it is true on day one and on day one
  // thousand. The real cities follow it.
  const rotating = [ALWAYS_TRUE, ...cities.slice(0, MAX_ROTATING_CITIES)];
  const [cityIndex, setCityIndex] = useState(0);

  useEffect(() => {
    if (rotating.length < 2) return;
    const interval = setInterval(() => {
      setCityIndex((current) => (current + 1) % rotating.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [rotating.length]);

  return (
    <section className="grid gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 md:px-12 md:py-24">
      <div className="flex flex-col gap-5 md:gap-6">
        <h1 className="font-heading text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Navigate good spots in{" "}
          <span key={cityIndex} className="inline-block animate-[cityFade_0.4s_ease]">
            {rotating[cityIndex] ?? ALWAYS_TRUE}
          </span>
        </h1>
        <p className="max-w-md text-base font-medium text-navey-ink/80">
          Discover coffee shops and restaurants worth the trip, curated by
          people who actually go there.
        </p>
        <form
          action="/explore"
          method="GET"
          className="flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
        >
          <span aria-hidden>🔍</span>
          <input
            type="text"
            name="q"
            placeholder="Search spots, cities, vibes..."
            className="flex-1 border-none bg-transparent text-base sm:text-sm outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-navey-ink px-4 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 sm:px-5"
          >
            <span className="sm:hidden">Search</span>
            <span className="hidden sm:inline">Let&apos;s explore</span>
          </button>
        </form>
        {/* These were six written-in labels pointing at /explore?tags=…, which
            had two faults. A label nothing carries led to an empty page, and
            every chip sent people to Explore -- the one public page rebuilt on
            every request, and the most expensive thing to open.
            They now come from the tags listings actually carry, and point at
            the tag's own page, which is built once and cached. Cheaper to
            serve, and a page Google can index rather than a filtered view
            marked noindex. */}
        <div className="flex flex-wrap items-center gap-2">
          {chips.slice(0, MAX_CHIPS).map((chip) => (
            <Link
              key={chip.slug}
              href={`/tag/${chip.slug}`}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold hover:bg-navey-band"
            >
              {chip.icon && (
                <span aria-hidden className="mr-1">
                  {chip.icon}
                </span>
              )}
              {chip.label}
            </Link>
          ))}
          <Link
            href="/explore"
            aria-label="More filters"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm hover:bg-navey-band"
          >
            <span aria-hidden>⋯</span>
          </Link>
        </div>
      </div>
      <FeaturedShowcase spots={featured} savedSpotIds={savedSpotIds} />
    </section>
  );
}
