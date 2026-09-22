import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OG_SIZE, homeCard } from "@/lib/og-image";

/**
 * Cached for a week rather than drawn on every request.
 *
 * Drawing a 1200x630 picture is one of the most expensive things this site
 * does, and these had no caching setting at all -- so every visit from a
 * Facebook, Messenger or Twitter crawler redrew one from scratch. Invisible
 * on the site itself, which is why it went unnoticed while the hosting bill
 * was being investigated.
 */
export const revalidate = 604800;

export const alt = "Navey — Navigate Good Spots Nearby";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/navey-icon.png"),
    "base64"
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(homeCard({ logoSrc }), { ...OG_SIZE });
}
