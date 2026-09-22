import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getApprovedSpotIds, getSpotDetail } from "@/lib/queries";
import { OG_SIZE, brandedCard, spotCard } from "@/lib/og-image";

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

/**
 * Without this the route stays render-on-demand and every crawler visit
 * redraws the picture, whatever the revalidate above says. Listing the real
 * spots moves the work into the build, which is billed separately from the
 * per-request allowance this project keeps running out of.
 *
 * It also means a fault in the drawing stops the build instead of quietly
 * serving a broken preview -- which is how one was found after a month of
 * failed deployments. See src/lib/og-image.tsx.
 */
export async function generateStaticParams() {
  const ids = await getApprovedSpotIds();
  return ids.map((id) => ({ id }));
}

export const alt = "Navey spot";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spot = await getSpotDetail(id);

  const logoData = await readFile(
    join(process.cwd(), "public/navey-icon.png"),
    "base64"
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  if (!spot) return new ImageResponse(brandedCard({ logoSrc }), { ...OG_SIZE });

  const photo = spot.galleryPhotos[0]?.url;
  if (!photo) {
    return new ImageResponse(brandedCard({ logoSrc, title: spot.name }), {
      ...OG_SIZE,
    });
  }

  return new ImageResponse(
    spotCard({
      logoSrc,
      photo,
      name: spot.name,
      city: spot.city,
      priceRange: spot.price_range,
    }),
    { ...OG_SIZE }
  );
}
