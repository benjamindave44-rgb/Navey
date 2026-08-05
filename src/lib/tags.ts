import { getTags, tagsInUse, type Tag } from "@/lib/queries";
import { tagSlug } from "@/lib/slug";

/**
 * "Rooftop bar BGC" and "unlimited chicken near me" are what people type, and
 * a filtered Explore URL cannot answer them -- every filter view carries the
 * same title, so search engines see near-duplicates and rank none.
 *
 * Only tags that something actually carries get a page. A page promising
 * pastries and listing nothing is worse than no page, and it would invite a
 * search engine to judge the site on thin content. Tag a listing and its page
 * appears on its own; there is nothing to switch on.
 */
export type TagEntry = Tag & { slug: string };

export async function getTagDirectory(): Promise<TagEntry[]> {
  const tags = tagsInUse(await getTags());
  return tags.map((tag) => ({ ...tag, slug: tagSlug(tag.label) }));
}

export async function findTagBySlug(slug: string): Promise<TagEntry | null> {
  const directory = await getTagDirectory();
  return directory.find((entry) => entry.slug === slug) ?? null;
}
