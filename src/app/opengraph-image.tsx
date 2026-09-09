import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Cached for a day rather than drawn on every request.
 *
 * Drawing a 1200x630 picture is one of the most expensive things this site
 * does, and these had no caching setting at all -- so every visit from a
 * Facebook, Messenger or Twitter crawler redrew one from scratch. Invisible
 * on the site itself, which is why it went unnoticed while the hosting bill
 * was being investigated.
 */
export const revalidate = 604800;

export const alt = "Navey — Navigate Good Spots Nearby";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/navey-icon.png"), "base64");
  const logoSrc = `data:image/png;base64,${logoData}`;

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
        <img src={logoSrc} alt="" width={160} height={160} />
        <div
          style={{
            marginTop: 28,
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          NAVEY
        </div>
        <div style={{ marginTop: 12, fontSize: 32, fontWeight: 600, opacity: 0.75 }}>
          Navigate Good Spots Nearby
        </div>
      </div>
    ),
    { ...size }
  );
}
