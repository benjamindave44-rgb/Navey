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
}: {
  spot: SpotWithTags;
  trending?: boolean;
  showSaveButton?: boolean;
}) {
  return (
    <Link
      href={`/spots/${spot.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(20,18,11,0.08)] transition-transform hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(20,18,11,0.14)]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-navey-band text-4xl">
        ☕
        {spot.hidden_gem && (
          <span className="absolute left-3 top-3 rounded-full bg-navey-ink px-3 py-1 text-xs font-bold text-navey-yellow">
            Hidden Gem
          </span>
        )}
        {trending && !spot.hidden_gem && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-navey-ink shadow-[0_4px_12px_rgba(20,18,11,0.12)]">
            Trending
          </span>
        )}
        {showSaveButton && <SaveHeartButton />}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="font-heading text-base font-bold">{spot.name}</p>
        <p className="text-sm text-navey-ink/70">
          {spot.city}
          {spot.price_range ? ` · ${spot.price_range}` : ""}
        </p>
        <p className="text-xs uppercase tracking-wide text-navey-ink/50">
          {CATEGORY_LABEL[spot.category] ?? spot.category}
        </p>
        {spot.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {spot.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-navey-band px-3 py-1 text-xs font-semibold"
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
