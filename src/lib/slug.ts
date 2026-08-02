/**
 * Pure string helpers, deliberately free of imports so they can be exercised
 * directly by the tests without dragging a database client along.
 */

/**
 * City names become public URLs, so this has to be stable: two spellings of
 * one city must never produce two rival pages competing for the same search.
 */
export function citySlug(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // Fold accents so "Poblacion" and "Poblacón" cannot split into two pages.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
