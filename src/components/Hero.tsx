"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SpotWithTags } from "@/lib/queries";

const CITIES = [
  "Philippines",
  "BGC, Taguig",
  "Cebu",
  "Baguio",
  "Siargao",
  "Quezon City",
  "Tagaytay",
  "Boracay",
  "Batangas",
  "Laguna",
  "Rizal",
];

const FILTER_CHIPS = ["WiFi", "24 Hours", "Hidden Gems", "Chill", "Date Spot", "Charging"];

export function Hero({ featured }: { featured: SpotWithTags | null }) {
  const [cityIndex, setCityIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCityIndex((current) => (current + 1) % CITIES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="grid gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 md:px-12 md:py-24">
      <div className="flex flex-col gap-5 md:gap-6">
        <h1 className="font-heading text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Navigate good spots in{" "}
          <span key={cityIndex} className="inline-block animate-[cityFade_0.4s_ease]">
            {CITIES[cityIndex]}
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
            className="flex-1 border-none bg-transparent text-sm outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-navey-ink px-4 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 sm:px-5"
          >
            <span className="sm:hidden">Search</span>
            <span className="hidden sm:inline">Let&apos;s explore</span>
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_CHIPS.map((chip) => (
            <Link
              key={chip}
              href={`/explore?tags=${encodeURIComponent(chip)}`}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold hover:bg-navey-band"
            >
              {chip}
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
      <div className="relative hidden items-center justify-center rounded-[260px_260px_40px_260px] bg-navey-band text-7xl md:flex">
        📍
        {featured && (
          <Link
            href={`/spots/${featured.id}`}
            className="group absolute -bottom-6 left-8 flex w-64 items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_16px_32px_rgba(20,18,11,0.16)] transition-transform hover:-translate-y-1"
          >
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-navey-band text-2xl">
              {featured.coverPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
                <img
                  src={featured.coverPhoto}
                  alt={featured.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                "☕"
              )}
              {featured.hidden_gem && (
                <span className="absolute -right-1 -top-1 text-base" aria-hidden>
                  🔥
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 text-left">
              <p className="truncate text-sm font-heading font-bold">
                {featured.name}
              </p>
              <p className="truncate text-xs text-navey-ink/60">
                {featured.city}
              </p>
            </div>
            <span
              aria-hidden
              className="ml-auto text-lg opacity-0 transition-opacity group-hover:opacity-100"
            >
              →
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
