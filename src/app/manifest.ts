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
    icons: [
      {
        src: "/navey-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/navey-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
