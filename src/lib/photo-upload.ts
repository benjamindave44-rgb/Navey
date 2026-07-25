import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Uploads valid image files to the `photos` bucket under `pathPrefix/` and
 * returns their public URLs. Invalid entries (wrong type, too large, or the
 * empty File Next.js sends for an untouched file input) are silently skipped.
 */
export async function uploadPhotos(
  supabase: SupabaseClient<Database>,
  files: FormDataEntryValue[],
  pathPrefix: string
): Promise<string[]> {
  const urls: string[] = [];

  for (const entry of files) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    if (entry.size > MAX_FILE_BYTES) continue;
    const extension = EXTENSION_BY_TYPE[entry.type];
    if (!extension) continue;

    const path = `${pathPrefix}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("photos").upload(path, entry, {
      contentType: entry.type,
      upsert: false,
    });
    if (error) continue;

    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

/** Recovers the storage object path from a public URL for deletion. */
export function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/photos/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}
