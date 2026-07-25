import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/owner", "/profile", "/reset-password", "/forgot-password"],
    },
    sitemap: "https://www.navey.co/sitemap.xml",
  };
}
