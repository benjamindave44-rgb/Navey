"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleSaveSpot } from "@/app/spots/actions";

export function SaveHeartButton({
  spotId,
  initialSaved = false,
  variant = "overlay",
}: {
  spotId: string;
  initialSaved?: boolean;
  variant?: "overlay" | "plain";
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function handleClick(event: React.MouseEvent) {
    // Cards wrap this button in a link to the spot.
    event.preventDefault();
    event.stopPropagation();

    // Flip immediately so the tap feels instant, then reconcile.
    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      const result = await toggleSaveSpot(spotId);
      if (result.status === "unauthenticated") {
        setSaved(!next);
        router.push("/sign-in");
        return;
      }
      if (result.status === "error") {
        setSaved(!next);
        return;
      }
      setSaved(result.status === "saved");
    });
  }

  const className =
    variant === "overlay"
      ? "absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base shadow-[0_4px_12px_rgba(20,18,11,0.12)] transition-transform hover:scale-110 active:scale-95"
      : "flex h-10 w-10 items-center justify-center rounded-full bg-navey-band text-lg transition-transform hover:scale-105 active:scale-95";

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save spot"}
      aria-pressed={saved}
      onClick={handleClick}
      className={`${className} ${pending ? "opacity-70" : ""}`}
    >
      <span aria-hidden className={saved ? "text-red-500" : "text-navey-ink/60"}>
        {saved ? "♥" : "♡"}
      </span>
    </button>
  );
}
