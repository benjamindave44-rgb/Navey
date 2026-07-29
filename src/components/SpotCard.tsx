import Image from "next/image";
import Link from "next/link";
import type { SpotWithTags } from "@/lib/queries";
import { SaveHeartButton } from "@/components/SaveHeartButton";

const CATEGORY_LABEL: Record<string, string> = {
  coffee_shop: "Coffee Shop",
  restaurant: "Restaurant",
  both: "Coffee Shop & Restaurant",
};

export function SpotCard({
  spot,
  trending = false,
  showSaveButton = false,
  saved = false,
  rank,
  showDescription = false,
}: {
  spot: SpotWithTags;
  trending?: boolean;
  showSaveButton?: boolean;
  saved?: boolean;
  rank?: number;
  showDescription?: boolean;
}) {
  return (
    <Link
      href={`/spots/${spot.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(20,18,11,0.08)] transition-transform hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(20,18,11,0.14)]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-navey-band text-4xl">
        {spot.coverPhoto ? (
          <Image
            src={spot.coverPhoto}
            alt={spot.name}
            fill
            // Cards sit two-up on phones and up to five-up on wide screens;
            // without this every grid downloads full-size originals.
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
          />
        ) : (
          "☕"
        )}
        {typeof rank === "number" && (
          <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-navey-ink text-xs font-bold text-navey-yellow">
            #{rank}
          </span>
        )}
        {spot.hidden_gem && (
          <span className="absolute right-3 top-3 rounded-full bg-navey-ink px-3 py-1 text-xs font-bold text-navey-yellow">
            Hidden Gem
          </span>
        )}
        {trending && !spot.hidden_gem && (
          <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-navey-ink shadow-[0_4px_12px_rgba(20,18,11,0.12)]">
            Trending
          </span>
        )}
        {showSaveButton && (
          <SaveHeartButton spotId={spot.id} initialSaved={saved} />
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <p className="font-heading text-sm font-bold sm:text-base">{spot.name}</p>
        <p className="text-xs text-navey-ink/70 sm:text-sm">
          {spot.city}
          {spot.price_range ? ` · ${spot.price_range}` : ""}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-navey-ink/50 sm:text-xs">
          {CATEGORY_LABEL[spot.category] ?? spot.category}
        </p>
        {showDescription && spot.description && (
          <p className="line-clamp-2 text-sm text-navey-ink/70">
            {spot.description}
          </p>
        )}
        {spot.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5 sm:gap-2">
            {spot.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-navey-band px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
