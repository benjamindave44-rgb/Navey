import type { MetadataRoute } from "next";

/**
 * Crawlers that scrape the site to train models take everything and send back
 * nothing -- no visitors, no links, no reason for a coffee shop to want to be
 * listed here. One of them, GPTBot, was measured pulling listing photos
 * through the image pipeline for hours.
 *
 * Search crawlers are not in this list, and must not be: they are how people
 * find Navey. Nor are the AI crawlers that actually cite and link back
 * (OAI-SearchBot, PerplexityBot) -- those can send a real visitor, so they are
 * worth what they cost.
 *
 * This file is a request, not a fence. Well-behaved crawlers honour it;
 * the rest are turned away by the firewall rules in the Vercel dashboard,
 * which is the part that actually enforces anything.
 */
const TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/owner",
          "/profile",
          "/settings",
          "/reset-password",
          "/forgot-password",
          // Every filter combination is a distinct URL, so crawlers walk them
          // endlessly -- each one a page render for a view that only
          // reshuffles spots already reachable from the sitemap. Paths in
          // robots.txt match by prefix, so this covers every query string on
          // /explore while leaving the unfiltered page crawlable.
          "/explore?",
        ],
      },
      {
        userAgent: TRAINING_CRAWLERS,
        disallow: "/",
      },
    ],
    sitemap: "https://www.navey.co/sitemap.xml",
  };
}
