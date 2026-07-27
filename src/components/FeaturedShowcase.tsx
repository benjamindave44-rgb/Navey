"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SpotWithTags } from "@/lib/queries";

const SLIDE_MS = 5000;

/**
 * Slow cross-fade rather than a sliding carousel: auto-advancing banners are
 * poor at holding attention, and only the first slide is eagerly loaded so
 * the hero image stays the fast LCP element.
 */
export function FeaturedShowcase({ spots }: { spots: SpotWithTags[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

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
          <Link
            key={spot.id}
            href={`/spots/${spot.id}`}
            aria-hidden={position !== index}
            tabIndex={position === index ? 0 : -1}
            className={`absolute inset-0 transition-opacity duration-700 ${
              position === index
                ? "opacity-100"
                : "pointer-events-none opacity-0"
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

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-16">
              <p className="font-heading text-xl font-extrabold text-white md:text-2xl">
                {spot.name}
              </p>
              <p className="text-sm font-medium text-white/80">
                {spot.city}
                {spot.price_range ? ` · ${spot.price_range}` : ""}
              </p>
            </div>

            {spot.hidden_gem && (
              <span className="absolute left-5 top-5 rounded-full bg-navey-ink px-3 py-1 text-xs font-bold text-navey-yellow">
                Hidden Gem
              </span>
            )}
          </Link>
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
              className={`h-2 rounded-full transition-all ${
                position === index
                  ? "w-6 bg-navey-ink"
                  : "w-2 bg-navey-ink/25 hover:bg-navey-ink/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
