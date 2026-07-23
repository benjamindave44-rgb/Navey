"use client";

import { useEffect, useState } from "react";

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

export function Hero() {
  const [cityIndex, setCityIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCityIndex((current) => (current + 1) % CITIES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="grid gap-10 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Navigate good spots in{" "}
          <span key={cityIndex} className="inline-block animate-[cityFade_0.4s_ease]">
            {CITIES[cityIndex]}
          </span>
        </h1>
        <p className="max-w-md text-base font-medium text-navey-ink/80">
          Discover coffee shops and restaurants worth the trip, curated by
          people who actually go there.
        </p>
        <div className="flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
          <span aria-hidden>🔍</span>
          <input
            type="text"
            placeholder="Search spots, cities, vibes..."
            className="flex-1 border-none bg-transparent text-sm outline-none"
            disabled
          />
          <button
            type="button"
            className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow"
            disabled
          >
            Let&apos;s explore
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
      <div className="hidden items-center justify-center rounded-[260px_260px_40px_260px] bg-navey-band text-7xl md:flex">
        📍
      </div>
    </section>
  );
}
