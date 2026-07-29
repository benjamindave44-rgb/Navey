"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Fullscreen photo viewer.
 *
 * Uses the same scroll-snap track as the inline slider so swiping feels
 * identical, rather than introducing a second, differently-behaving gesture
 * for the same content.
 */
export function PhotoLightbox({
  photos,
  name,
  startIndex,
  onClose,
}: {
  photos: { id: string; url: string }[];
  name: string;
  startIndex: number;
  onClose: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(startIndex);

  // Open on the photo that was tapped, without animating there from photo one.
  useEffect(() => {
    const track = trackRef.current;
    if (track) track.scrollLeft = startIndex * track.clientWidth;
    closeRef.current?.focus();
  }, [startIndex]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function step(delta: number) {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(photos.length - 1, index + delta));
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    setIndex(next);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} photos`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-semibold">
          {index + 1} / {photos.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close photos"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg hover:bg-white/25"
        >
          ✕
        </button>
      </div>

      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          const next = Math.round(track.scrollLeft / track.clientWidth);
          if (next !== index) setIndex(next);
        }}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, position) => (
          <div
            key={photo.id}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={photo.url}
              alt={`${name} — photo ${position + 1} of ${photos.length}`}
              fill
              sizes="100vw"
              // contain, not cover: this view exists to show the whole photo.
              className="object-contain"
            />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={index === 0}
            aria-label="Previous photo"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={index === photos.length - 1}
            aria-label="Next photo"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
