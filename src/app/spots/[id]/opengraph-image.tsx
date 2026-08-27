import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getApprovedSpotIds, getSpotDetail } from "@/lib/queries";

/**
 * Cached for a day rather than drawn on every request.
 *
 * Drawing a 1200x630 picture is one of the most expensive things this site
 * does, and these had no caching setting at all -- so every visit from a
 * Facebook, Messenger or Twitter crawler redrew one from scratch. Invisible
 * on the site itself, which is why it went unnoticed while the hosting bill
 * was being investigated.
 */
export const revalidate = 86400;

/**
 * Without this the route stays render-on-demand and every crawler visit
 * redraws the picture, whatever the revalidate above says. Listing the real
 * spots moves the work into the build, which is billed separately from the
 * per-request allowance this project keeps running out of.
 */
export async function generateStaticParams() {
  const ids = await getApprovedSpotIds();
  return ids.map((id) => ({ id }));
}

export const alt = "Navey spot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function brandedFallback(logoSrc: string, title?: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFDE00",
          color: "#14120B",
        }}
      >
        <img src={logoSrc} alt="" width={140} height={140} />
        {title && (
          <div style={{ marginTop: 28, fontSize: 64, fontWeight: 800, textAlign: "center" }}>
            {title}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spot = await getSpotDetail(id);

  const logoData = await readFile(join(process.cwd(), "public/navey-icon.png"), "base64");
  const logoSrc = `data:image/png;base64,${logoData}`;

  if (!spot) return brandedFallback(logoSrc);

  const photo = spot.galleryPhotos[0]?.url;
  if (!photo) return brandedFallback(logoSrc, spot.name);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#14120B",
        }}
      >
        <img
          src={photo}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 64,
            background:
              "linear-gradient(to top, rgba(20,18,11,0.92), rgba(20,18,11,0.15))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <img src={logoSrc} alt="" width={56} height={56} />
            <span style={{ fontSize: 32, fontWeight: 800, color: "#FFDE00" }}>NAVEY</span>
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
            {spot.name}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
              marginTop: 12,
            }}
          >
            {spot.city}
            {spot.price_range ? ` · ${spot.price_range}` : ""}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
