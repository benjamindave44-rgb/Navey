"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SaveHeartButton } from "@/components/SaveHeartButton";
import type { SpotWithTags } from "@/lib/queries";

const SLIDE_MS = 5000;

const CATEGORY_LABEL: Record<string, string> = {
  coffee_shop: "Coffee Shop",
  restaurant: "Restaurant",
  both: "Coffee & Restaurant",
};

/**
 * Slow cross-fade rather than a sliding carousel: auto-advancing banners are
 * poor at holding attention, and only the first slide is eagerly loaded so
 * the hero image stays the fast LCP element.
 */
export function FeaturedShowcase({
  spots,
  savedSpotIds = [],
}: {
  spots: SpotWithTags[];
  savedSpotIds?: string[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);
  const saved = new Set(savedSpotIds);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  useEffect(() => {
    if (paused || reducedMotion.current || spots.length < 2) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % spots.length),
      SLIDE_MS
    );
    return () => clearInterval(timer);
  }, [paused, spots.length]);

  if (spots.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-[40px] bg-navey-band text-center md:aspect-auto md:min-h-[420px] md:rounded-[260px_260px_40px_260px]">
        <p className="max-w-[220px] px-6 text-sm font-semibold text-navey-ink/45">
          This week&apos;s picks land here once spots are featured.
        </p>
      </div>
    );
  }

  const active = spots[index];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-navey-ink/50">
        Our picks this week
      </p>

      <div className="relative aspect-[4/3] overflow-hidden rounded-[40px] bg-navey-band md:aspect-auto md:min-h-[420px] md:rounded-[260px_260px_40px_260px]">
        {spots.map((spot, position) => (
          <div
            key={spot.id}
            aria-hidden={position !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              position === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {spot.coverPhoto ? (
              <Image
                src={spot.coverPhoto}
                alt={spot.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={position === 0}
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-7xl">
                📍
              </span>
            )}

            {/* Covers the photo so the whole image is clickable, while the
                details below keep their own links and buttons. */}
            <Link
              href={`/spots/${spot.id}`}
              aria-label={`View ${spot.name}`}
              tabIndex={position === index ? 0 : -1}
              className="absolute inset-0"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 pt-20">
              <div
                key={`${spot.id}-${index}`}
                className="pointer-events-auto animate-[riseIn_0.45s_ease-out]"
              >
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {spot.hidden_gem && (
                    <span className="rounded-full bg-navey-yellow px-2.5 py-0.5 text-[11px] font-bold text-navey-ink">
                      💎 Hidden Gem
                    </span>
                  )}
                  {spot.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/spots/${spot.id}`}
                  tabIndex={position === index ? 0 : -1}
                  className="font-heading text-2xl font-extrabold leading-tight text-white underline-offset-4 hover:underline md:text-3xl"
                >
                  {spot.name}
                </Link>

                <p className="mt-1 text-sm font-medium text-white/85">
                  {CATEGORY_LABEL[spot.category] ?? spot.category}
                  {spot.price_range ? ` · ${spot.price_range}` : ""} ·{" "}
                  {spot.city}
                  {spot.saveCount > 0 && (
                    <span className="text-white/70">
                      {" "}
                      · ♥ {spot.saveCount}
                    </span>
                  )}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/spots/${spot.id}`}
                    tabIndex={position === index ? 0 : -1}
                    className="rounded-full bg-white px-4 py-2 text-xs font-bold text-navey-ink transition-transform hover:scale-105 active:scale-95"
                  >
                    View spot →
                  </Link>
                  <SaveHeartButton
                    spotId={spot.id}
                    initialSaved={saved.has(spot.id)}
                    variant="plain"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {spots.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {spots.map((spot, position) => (
            <button
              key={spot.id}
              type="button"
              aria-label={`Show ${spot.name}`}
              aria-current={position === index}
              onClick={() => setIndex(position)}
              className={`h-2 overflow-hidden rounded-full transition-all ${
                position === index
                  ? "w-6 bg-navey-ink"
                  : "w-2 bg-navey-ink/25 hover:bg-navey-ink/50"
              }`}
            >
              {position === index && !paused && spots.length > 1 && (
                <span
                  key={index}
                  className="block h-full animate-[dotProgress_5s_linear] bg-navey-ink"
                />
              )}
            </button>
          ))}
        </div>
      )}

      <p className="sr-only" role="status">
        Showing {active.name}, pick {index + 1} of {spots.length}
      </p>
    </div>
  );
}
