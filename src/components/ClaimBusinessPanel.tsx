"use client";

import Link from "next/link";
import { useViewer } from "@/lib/use-viewer";

/**
 * Hidden from the person who submitted the listing -- offering them a claim on
 * their own contribution reads as a bug.
 *
 * This is the only thing on a spot page that differed between visitors, and
 * answering it on the server meant every coffee shop page was rebuilt for
 * every person who opened it. The contributor's id is already on the page as a
 * public profile link, so nothing new is exposed by deciding it here.
 */
export function ClaimBusinessPanel({
  spotId,
  contributorId,
}: {
  spotId: string;
  contributorId: string | null;
}) {
  const viewer = useViewer();
  const isOwner =
    viewer.status === "signed-in" &&
    contributorId !== null &&
    viewer.id === contributorId;

  if (isOwner) return null;

  return (
    <div className="rounded-2xl bg-navey-band p-4">
      <p className="font-heading font-bold">Own this business?</p>
      <p className="mt-1 text-sm text-navey-ink/70">
        Claim this listing to manage its menu, hours, and photos.
      </p>
      <Link
        href={`/spots/${spotId}/claim`}
        className="mt-3 inline-block rounded-full bg-navey-ink px-4 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
      >
        Claim this business
      </Link>
    </div>
  );
}
