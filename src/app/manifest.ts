import type { MetadataRoute } from "next";

/**
 * Lets Navey be added to a phone's home screen and open without browser
 * chrome. Most of the audience is on Android, where this is the closest
 * thing to an app without shipping one.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Navey — Navigate Good Spots Nearby",
    short_name: "Navey",
    description:
      "Discover coffee shops and restaurants worth the trip across the Philippines.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffde00",
    theme_color: "#ffde00",
    orientation: "portrait",
    categories: ["food", "travel", "lifestyle"],
    /**
     * The source mark is black on transparency, which is the worst possible
     * input here: iOS composites transparency onto black, and Android fills it
     * in itself when masking to a circle or squircle. Both produced a black
     * blob. These are drawn on the brand yellow with no alpha at all.
     *
     * "any" and "maskable" are separate files rather than one doing both. A
     * maskable icon can have its edges sliced off, so its mark is drawn
     * smaller; using that padding everywhere would leave the icon looking lost
     * on platforms that do not mask. Rebuild with scripts/make-icons.mjs.
     */
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
