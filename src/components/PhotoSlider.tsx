"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { PhotoLightbox } from "@/components/PhotoLightbox";

/**
 * Swipeable photo strip.
 *
 * Built on CSS scroll-snap rather than a carousel library: native scrolling
 * gives real momentum and rubber-banding on phones, keeps working without
 * JavaScript, and adds nothing to the bundle. Arrows are for pointer devices;
 * on touch the swipe is the interaction.
 */
export function PhotoSlider({
  photos,
  name,
  aspect = "aspect-[4/3]",
  emptyIcon = "☕",
  priority = false,
}: {
  photos: { id: string; url: string }[];
  name: string;
  aspect?: string;
  emptyIcon?: string;
  priority?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div
        className={`flex ${aspect} items-center justify-center navey-arch-card bg-navey-band text-6xl`}
      >
        <span aria-hidden>{emptyIcon}</span>
      </div>
    );
  }

  function scrollTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(photos.length - 1, next));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          const next = Math.round(track.scrollLeft / track.clientWidth);
          if (next !== index) setIndex(next);
        }}
        className={`flex ${aspect} snap-x snap-mandatory overflow-x-auto overscroll-x-contain navey-arch-card bg-navey-band [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {photos.map((photo, position) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxAt(position)}
            aria-label={`View photo ${position + 1} of ${photos.length} full screen`}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={photo.url}
              alt={`${name} — photo ${position + 1} of ${photos.length}`}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              priority={priority && position === 0}
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {photos.length > 1 && (
        <>
          {/* Pointer-only: swiping is the touch interaction. */}
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => scrollTo(index - 1)}
            disabled={index === 0}
            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-sm font-bold shadow-[0_4px_12px_rgba(20,18,11,0.18)] disabled:opacity-0 md:flex"
          >
            <span aria-hidden>←</span>
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => scrollTo(index + 1)}
            disabled={index === photos.length - 1}
            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-sm font-bold shadow-[0_4px_12px_rgba(20,18,11,0.18)] disabled:opacity-0 md:flex"
          >
            <span aria-hidden>→</span>
          </button>

          <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white">
            {index + 1}/{photos.length}
          </span>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            {photos.map((photo, position) => (
              <button
                key={photo.id}
                type="button"
                aria-label={`Go to photo ${position + 1}`}
                aria-current={position === index}
                onClick={() => scrollTo(position)}
                className={`h-1.5 rounded-full transition-all ${
                  position === index
                    ? "w-5 bg-navey-ink"
                    : "w-1.5 bg-navey-ink/25"
                }`}
              />
            ))}
          </div>
        </>
      )}
      {lightboxAt !== null && (
        <PhotoLightbox
          photos={photos}
          name={name}
          startIndex={lightboxAt}
          onClose={() => setLightboxAt(null)}
        />
      )}
    </div>
  );
}
