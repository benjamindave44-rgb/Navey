import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/owner",
        "/profile",
        "/reset-password",
        "/forgot-password",
        // Every filter combination is a distinct URL, so crawlers walk them
        // endlessly -- each one a fresh database round trip for a page that
        // only reshuffles spots already reachable from the sitemap. Paths in
        // robots.txt match by prefix, so this covers every query string on
        // /explore while leaving the unfiltered page crawlable.
        "/explore?",
      ],
    },
    sitemap: "https://www.navey.co/sitemap.xml",
  };
}
