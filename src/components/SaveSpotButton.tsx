"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleSaveSpot } from "@/app/spots/actions";

/** Labelled save control for the spot detail page. */
export function SaveSpotButton({
  spotId,
  initialSaved = false,
}: {
  spotId: string;
  initialSaved?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function handleClick() {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
        saved
          ? "bg-navey-ink text-navey-yellow"
          : "bg-navey-band hover:bg-navey-band/70"
      } ${pending ? "opacity-70" : ""}`}
    >
      {saved ? "♥ Saved" : "♡ Save"}
    </button>
  );
}
