import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

import {
  MAX_IMAGE_BYTES,
  MAX_UPLOAD_TOTAL_BYTES,
  PDF_TYPE,
} from "@/lib/upload-limits";
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
  pathPrefix: string,
  /** Menus are often published as a PDF; galleries stay images-only. */
  { allowPdf = false }: { allowPdf?: boolean } = {}
): Promise<{ urls: string[]; failed: number }> {
  const accepted: { entry: File; path: string; type: string }[] = [];
  let failed = 0;

  for (const entry of files) {
    if (!(entry instanceof File) || entry.size === 0) continue;

    const isPdf = allowPdf && entry.type === PDF_TYPE;
    const extension = isPdf ? "pdf" : EXTENSION_BY_TYPE[entry.type];
    if (!extension) {
      failed++;
      continue;
    }
    if (entry.size > (isPdf ? MAX_UPLOAD_TOTAL_BYTES : MAX_IMAGE_BYTES)) {
      failed++;
      continue;
    }

    accepted.push({
      entry,
      path: `${pathPrefix}/${crypto.randomUUID()}.${extension}`,
      type: entry.type,
    });
  }

  // Sent together rather than one after another. These are independent network
  // round trips to storage, so waiting for each before starting the next made
  // uploading four photos take four times as long as uploading one.
  const results = await Promise.all(
    accepted.map(async ({ entry, path, type }) => {
      const { error } = await supabase.storage.from("photos").upload(path, entry, {
        contentType: type,
        upsert: false,
      });
      if (error) return null;
      return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
    })
  );

  // Promise.all keeps order, so the photos land in the order they were picked.
  const urls = results.filter((url): url is string => url !== null);
  failed += results.length - urls.length;

  return { urls, failed };
}

/** Recovers the storage object path from a public URL for deletion. */
export function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/photos/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

// Same platform ceiling as everything else posted through a form.
const MAX_DOCUMENT_BYTES = MAX_UPLOAD_TOTAL_BYTES;
const DOCUMENT_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

/**
 * Uploads a single proof-of-ownership document to the private
 * `claim-proofs` bucket and returns its storage path (not a public URL --
 * the bucket isn't public, so viewing it later requires a signed URL).
 */
export async function uploadClaimProof(
  supabase: SupabaseClient<Database>,
  file: FormDataEntryValue | null,
  pathPrefix: string
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_DOCUMENT_BYTES) return null;
  const extension = DOCUMENT_EXTENSION_BY_TYPE[file.type];
  if (!extension) return null;

  const path = `${pathPrefix}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("claim-proofs").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return null;

  return path;
}
