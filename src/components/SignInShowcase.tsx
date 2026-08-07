"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type ShowcaseSpot = {
  id: string;
  name: string;
  city: string;
  photo: string;
};

/**
 * What someone sees while deciding whether to make an account.
 *
 * It was a map emoji on an empty panel, and on a phone it was not there at
 * all -- the panel was hidden below the medium breakpoint, so most visitors
 * got a bare form on a blank page. That is the worst possible answer to "what
 * is this and why would I join it".
 *
 * It now shows real listings, one at a time, captioned with the actual place
 * and city. The dots are real controls rather than decoration: a photo someone
 * liked should not slide away because a timer said so.
 */
export function SignInShowcase({
  spots,
  spotCount,
  cityCount,
}: {
  spots: ShowcaseSpot[];
  spotCount: number;
  cityCount: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (spots.length < 2 || paused) return;
    // Read directly rather than holding it in state: someone who has asked
    // their device to stop animations should get a still image, not a slower
    // carousel.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(
      () => setIndex((current) => (current + 1) % spots.length),
      4500
    );
    return () => clearInterval(timer);
  }, [spots.length, paused]);

  if (spots.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-navey-band px-8 py-10 text-center">
        <span className="text-5xl md:text-7xl" aria-hidden>
          🗺️
        </span>
        <p className="font-heading text-xl font-extrabold md:text-2xl">
          Navigate good spots, together
        </p>
      </div>
    );
  }

  const current = spots[index];

  return (
    <div
      className="relative h-full overflow-hidden bg-navey-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {spots.map((spot, i) => (
        <Image
          key={spot.id}
          src={spot.photo}
          alt=""
          fill
          priority={i === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Darkest at the bottom where the words sit, so the photo still reads
          as a photo rather than as a flat tinted panel. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-navey-ink via-navey-ink/70 to-navey-ink/25"
      />

      <div className="relative flex h-full flex-col justify-end gap-3 p-6 md:justify-center md:p-12 md:text-center">
        <div className="md:mx-auto md:max-w-sm">
          <p className="font-heading text-2xl font-extrabold text-navey-yellow md:text-3xl">
            Navigate good spots, together
          </p>
          <p className="mt-2 text-sm text-white/85">
            Save the ones you love, write reviews, and help other explorers find
            the good stuff.
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-white/60">
            {spotCount} spots · {cityCount} {cityCount === 1 ? "city" : "cities"}
          </p>
        </div>

        <div className="mt-1 flex items-center gap-3 md:mx-auto">
          <div className="flex gap-1.5">
            {spots.map((spot, i) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => {
                  setIndex(i);
                  setPaused(true);
                }}
                aria-label={`Show ${spot.name}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-navey-yellow" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
          <p className="truncate text-xs font-semibold text-white/75">
            {current.name} · {current.city}
          </p>
        </div>
      </div>
    </div>
  );
}
