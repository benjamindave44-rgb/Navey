const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

/**
 * Shrinks a photo in the browser before it is ever uploaded.
 *
 * Phone cameras produce 3-8MB files, and a Server Action request has to fit
 * inside the hosting platform's fixed body limit (~4.5MB) -- which the app's
 * own bodySizeLimit cannot raise. Sending originals therefore killed the
 * request outright. Resizing also keeps listing pages fast for visitors.
 *
 * Returns the original file untouched if anything goes wrong, so a failure
 * here degrades to the old behaviour rather than losing the photo.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    // JPEG has no alpha channel; without this, transparent PNGs turn black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
