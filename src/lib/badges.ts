/**
 * Shared "which badge fits this person best" logic, used by both the
 * Leaderboard and Public Profile pages so the badge shown for someone
 * is always the same wherever it appears.
 */
export function computeTopBadge(counts: {
  reviews: number;
  saves: number;
  hiddenGems: number;
  lists: number;
}): string {
  const categories: [string, number][] = [
    ["💎 Gem Hunter", counts.hiddenGems],
    ["✍️ Top Reviewer", counts.reviews],
    ["🗂 List Maker", counts.lists],
    ["📍 Explorer", counts.saves],
  ];
  categories.sort((a, b) => b[1] - a[1]);
  return categories[0][1] > 0 ? categories[0][0] : "📍 Explorer";
}
