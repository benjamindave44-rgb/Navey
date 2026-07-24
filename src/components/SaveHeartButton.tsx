"use client";

import { useState } from "react";

export function SaveHeartButton() {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save spot"}
      aria-pressed={saved}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setSaved((current) => !current);
      }}
      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-base shadow-[0_4px_12px_rgba(20,18,11,0.12)] transition-transform hover:scale-110"
    >
      <span aria-hidden className={saved ? "text-red-500" : "text-navey-ink/60"}>
        {saved ? "♥" : "♡"}
      </span>
    </button>
  );
}
