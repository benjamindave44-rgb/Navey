/**
 * Decides which tags a card shows.
 *
 * A listing can carry a dozen tags, and printing them all turned every card
 * into a wall of chips taller than its own photo -- which is what made the
 * grid hard to scan and buried the photograph the listing is actually sold on.
 *
 * The rule is one tag per kind, in the order a person would want them:
 * what makes this place notable, what it feels like, what it is good for,
 * then what it serves or provides. Three of those tell you more than ten of
 * anything, because ten tags from one group ("Chill, Cozy, Quiet") say the
 * same thing three times.
 *
 * The full list still appears on the listing's own page. This only decides
 * what survives onto a card.
 */

export type TaggedForCard = {
  label: string;
  group: string;
  sort: number;
};

/** Lower comes first. Anything unrecognised sorts last but is still kept. */
const GROUP_RANK: Record<string, number> = {
  Standout: 0,
  Vibe: 1,
  "Good for": 2,
  "Food & Drink": 3,
  Practical: 4,
};

function rankOf(group: string): number {
  return GROUP_RANK[group] ?? Number.MAX_SAFE_INTEGER;
}

/**
 * Returns every label, reordered so the leading few are one-per-group in
 * priority order. Callers take as many as they have room for; nothing is
 * discarded, so the same list still serves anywhere the whole set is wanted.
 */
export function orderTagsForCards(tags: TaggedForCard[]): string[] {
  const byGroup = new Map<string, TaggedForCard[]>();
  for (const tag of tags) {
    const bucket = byGroup.get(tag.group) ?? [];
    bucket.push(tag);
    byGroup.set(tag.group, bucket);
  }

  // Within a group, the taxonomy's own order decides which is most
  // representative, so "Chill" wins over "Instagrammable".
  for (const bucket of byGroup.values()) {
    bucket.sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));
  }

  const groups = [...byGroup.keys()].sort(
    (a, b) => rankOf(a) - rankOf(b) || a.localeCompare(b)
  );

  // Round-robin: one from each group before any group gets a second, so a
  // spot tagged Chill + Cozy + Quiet does not spend all three slots saying
  // the same thing.
  const ordered: string[] = [];
  let depth = 0;
  let added = true;
  while (added) {
    added = false;
    for (const group of groups) {
      const tag = byGroup.get(group)?.[depth];
      if (tag) {
        ordered.push(tag.label);
        added = true;
      }
    }
    depth += 1;
  }

  return ordered;
}
