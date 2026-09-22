/**
 * Recently enough to be worth pointing at.
 *
 * "What opened lately?" is the question a coffee lover asks most often, and the
 * answer was already in the database -- every listing records when it was
 * added, and nothing on the site ever said so.
 *
 * Thirty days rather than "this calendar month", so the row does not empty out
 * on the first of every month and refill by the tenth.
 */
const RECENT_DAYS = 30;

export function isRecentlyAdded(dateString: string, now = Date.now()): boolean {
  const added = new Date(dateString).getTime();
  if (!Number.isFinite(added)) return false;
  const days = (now - added) / (1000 * 60 * 60 * 24);
  // A future timestamp is bad data, not a brand-new listing.
  return days >= 0 && days <= RECENT_DAYS;
}

/**
 * A date a person confirmed something, written for a reader: "September 2026".
 *
 * Read in Manila, because a date stored as a plain day should not shift
 * backwards for a visitor whose browser is set to somewhere else.
 */
export function monthAndYear(dateString: string): string | null {
  const date = new Date(`${dateString}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
