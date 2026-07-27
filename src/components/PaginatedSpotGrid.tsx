"use client";

import { useState } from "react";
import { SpotCard } from "@/components/SpotCard";
import type { SpotWithTags } from "@/lib/queries";

const PAGE_SIZE = 8;

export function PaginatedSpotGrid({
  spots,
  savedSpotIds = [],
}: {
  spots: SpotWithTags[];
  savedSpotIds?: string[];
}) {
  const saved = new Set(savedSpotIds);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = spots.slice(0, visible);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {shown.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            showSaveButton
            saved={saved.has(spot.id)}
          />
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
