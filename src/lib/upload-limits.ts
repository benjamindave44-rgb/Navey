/**
 * The hosting platform caps a Server Action request body at roughly 4.5MB and
 * the app's own bodySizeLimit cannot raise it. Going over does not produce a
 * handled error -- the request is killed before any code runs, so the visitor
 * sees the site fall over rather than a message telling them what went wrong.
 *
 * Photos are resized in the browser first, so they land far below this.
 * PDFs are not: a menu exported at print quality can easily be 10MB and goes
 * up exactly as it came off the designer's machine. That is what has to be
 * caught before it is ever sent.
 *
 * The budget covers the whole request, not one file, because a batch of
 * attachments is submitted together.
 */
export const MAX_UPLOAD_TOTAL_BYTES = 4 * 1024 * 1024;

/** Post-resize photos are small; this only catches something pathological. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const PDF_TYPE = "application/pdf";

/**
 * How many files a listing may hold, per kind. Defined once because the form
 * and the server both enforce it: if they drift, the picker lets someone
 * attach files the server then silently drops.
 *
 * Menus are the generous one. A cafe fits on a board, but a restaurant menu
 * runs to a dozen pages, and being told to leave half of it out is the point
 * where an owner gives up. A single PDF still counts as one file, which is
 * the better answer for anything long.
 */
export const PHOTO_LIMITS = {
  gallery: 12,
  menu: 20,
} as const;

export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 10 ? `${Math.round(mb)}MB` : `${mb.toFixed(1)}MB`;
}

export const UPLOAD_LIMIT_LABEL = formatBytes(MAX_UPLOAD_TOTAL_BYTES);

/**
 * Splits a batch into what fits inside one request and what does not, so the
 * browser can refuse the oversized files with a message naming them instead
 * of letting the upload take the page down.
 */
export function withinUploadBudget(
  existing: File[],
  incoming: File[]
): { accepted: File[]; rejected: File[] } {
  let used = existing.reduce((total, file) => total + file.size, 0);
  const accepted: File[] = [];
  const rejected: File[] = [];

  for (const file of incoming) {
    if (used + file.size > MAX_UPLOAD_TOTAL_BYTES) {
      rejected.push(file);
      continue;
    }
    used += file.size;
    accepted.push(file);
  }

  return { accepted, rejected };
}
