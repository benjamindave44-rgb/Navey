"use client";

import { useReactions } from "@/lib/use-reactions";

/**
 * Six taps instead of an essay.
 *
 * This site has one review, from four accounts, on pages that invite people to
 * join a community. Asking a stranger to write a paragraph about a coffee shop
 * is a large favour and almost nobody does it. Asking for one tap on the way
 * out of the door is a different size of request entirely, and it is the same
 * information in aggregate.
 *
 * Both flattering and unflattering labels, on purpose. A board that only offers
 * praise reads as marketing and is believed by nobody -- and "too noisy" is
 * precisely the fact somebody most needs before driving across the city.
 *
 * No sign-in. See src/lib/use-reactions.ts for why, and for what that costs.
 */
const LABELS: { id: string; text: string; emoji: string }[] = [
  { id: "good_for_working", text: "Good for working", emoji: "💻" },
  { id: "great_coffee", text: "Great coffee", emoji: "☕" },
  { id: "great_food", text: "Great food", emoji: "🍽️" },
  { id: "good_value", text: "Good value", emoji: "👍" },
  { id: "too_noisy", text: "Too noisy", emoji: "🔊" },
  { id: "pricey", text: "Pricey", emoji: "💸" },
];

export function SpotReactions({
  spotId,
  initialCounts,
}: {
  spotId: string;
  initialCounts: Record<string, number>;
}) {
  const { counts, mine, pending, toggle } = useReactions(spotId, initialCounts);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
      <p className="font-heading font-bold">Been here?</p>
      <p className="mt-1 text-xs text-navey-ink/60">
        One tap. No account needed.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {LABELS.map((label) => {
          const count = counts[label.id] ?? 0;
          const isMine = mine.has(label.id);

          return (
            <button
              key={label.id}
              type="button"
              onClick={() => toggle(label.id)}
              disabled={pending !== null}
              // Says what tapping does and what state it is in, because the
              // colour change alone is invisible to a screen reader.
              aria-pressed={isMine}
              aria-label={`${label.text}${count > 0 ? `, ${count} so far` : ""}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                isMine
                  ? "border-navey-ink bg-navey-ink text-navey-yellow"
                  : "border-black/10 bg-navey-band text-navey-ink hover:border-navey-ink/30"
              }`}
            >
              <span aria-hidden>{label.emoji}</span>
              {label.text}
              {count > 0 && (
                <span
                  className={isMine ? "text-navey-yellow/80" : "text-navey-ink/50"}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
