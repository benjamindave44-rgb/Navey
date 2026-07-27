"use client";

import { useState } from "react";

/**
 * Uses the native share sheet where the device offers one -- on a phone that
 * means Messenger, Viber and Instagram are one tap away, which is how a spot
 * actually spreads here. Desktop browsers mostly lack it, so fall back to
 * copying the link.
 */
export function ShareSpotButton({
  name,
  city,
}: {
  name: string;
  city: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `${name} in ${city} — found on Navey`,
          url,
        });
        return;
      } catch {
        // Dismissing the share sheet throws; fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; nothing useful left to try.
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        aria-label={`Share ${name}`}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-navey-band text-lg transition-transform hover:scale-105 active:scale-95"
      >
        <span aria-hidden>↗</span>
      </button>
      {copied && (
        <span
          role="status"
          className="absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-full bg-navey-ink px-3 py-1 text-xs font-bold text-navey-yellow"
        >
          Link copied
        </span>
      )}
    </div>
  );
}
