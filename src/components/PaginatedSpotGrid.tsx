"use client";

import { useState } from "react";
import { SpotCard } from "@/components/SpotCard";
import type { SpotWithTags } from "@/lib/queries";

const PAGE_SIZE = 8;

export function PaginatedSpotGrid({ spots }: { spots: SpotWithTags[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = spots.slice(0, visible);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((spot) => (
          <SpotCard key={spot.id} spot={spot} showSaveButton />
        ))}
      </div>
      {visible < spots.length && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((current) => current + PAGE_SIZE)}
            className="rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
          >
            Show more spots
          </button>
        </div>
      )}
    </>
  );
}
