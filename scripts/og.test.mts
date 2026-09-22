import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og.js";
import { OG_SIZE, brandedCard, homeCard, spotCard } from "../src/lib/og-image.ts";

/**
 * Draws every link-preview picture for real and fails if any of them cannot be
 * drawn.
 *
 * This test exists because of a specific month-long outage. The listing image
 * had a div with two children and no explicit `display`, which Satori refuses.
 * Nothing caught it: it is not a type error, not a lint error, and it is
 * invisible on the site, because nobody looks at their own link previews.
 * Once the drawing moved into the build it stopped four deployments in a row,
 * and the live site silently stayed on a build from a month earlier.
 *
 * A real render is the only thing that would have caught it, so that is what
 * this does -- including `arrayBuffer()`, because the picture is drawn lazily
 * and constructing the response alone proves nothing.
 */

let failures = 0;

async function draws(label: string, element: React.ReactElement) {
  try {
    const response = new ImageResponse(element, { ...OG_SIZE });
    const bytes = await response.arrayBuffer();

    if (bytes.byteLength === 0) {
      console.error(`FAIL ${label}\n  drew an empty image`);
      failures++;
      return;
    }
    console.log(`ok   ${label} (${Math.round(bytes.byteLength / 1024)} KB)`);
  } catch (error) {
    console.error(
      `FAIL ${label}\n  ${error instanceof Error ? error.message : String(error)}`
    );
    failures++;
  }
}

const logoData = await readFile(
  join(process.cwd(), "public/navey-icon.png"),
  "base64"
);
const logoSrc = `data:image/png;base64,${logoData}`;

// A local data URL rather than a real photo: this checks the drawing, and
// reaching out to Supabase would make the test fail when the network does.
const photo = logoSrc;

await draws("homepage card", homeCard({ logoSrc }));
await draws("branded fallback, no title", brandedCard({ logoSrc }));
await draws(
  "branded fallback, with title",
  brandedCard({ logoSrc, title: "Curated by Angkan" })
);

// The exact shape that broke the build: a city and a price range together.
await draws(
  "listing card with a price",
  spotCard({
    logoSrc,
    photo,
    name: "Tiny Mountain Coffee",
    city: "Makati",
    priceRange: "₱₱",
  })
);

// And without one, because the old code still rendered two children in that
// case -- the second was simply an empty string, which Satori counts.
await draws(
  "listing card without a price",
  spotCard({
    logoSrc,
    photo,
    name: "Tiny Mountain Coffee",
    city: "Makati",
    priceRange: null,
  })
);

// A long name wraps rather than overflowing into nothing.
await draws(
  "listing card with a very long name",
  spotCard({
    logoSrc,
    photo,
    name: "The Extremely Long Coffee Shop Name That Someone Will Eventually Add",
    city: "Quezon City",
    priceRange: "₱₱₱",
  })
);

console.log(failures === 0 ? "\nAll checks passed" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
