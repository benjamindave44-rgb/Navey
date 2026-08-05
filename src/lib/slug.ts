/**
 * Pure string helpers, deliberately free of imports so they can be exercised
 * directly by the tests without dragging a database client along.
 */

/**
 * Turns a name into a URL segment. These become public addresses, so it has to
 * be stable: two spellings of one thing must never produce two rival pages
 * competing for the same search.
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // Fold accents so "Poblacion" and "Poblacón" cannot split into two pages.
    .replace(/[̀-ͯ]/g, "")
    // "&" reads as a word, not a separator: "Grilled & Inasal" should not
    // collapse into a double dash.
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Cities and tags share the same rules; named separately for readability at
 *  the call sites. */
export const citySlug = slugify;
export const tagSlug = slugify;
