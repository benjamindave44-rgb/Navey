import type { Metadata, Viewport } from "next";
import { Sora, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GuestSaveImporter } from "@/components/GuestSaveImporter";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Colours the browser chrome on Android and the status bar area on iOS,
// so the app doesn't sit inside a stark white frame.
export const viewport: Viewport = {
  themeColor: "#ffde00",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.navey.co"),
  // The bare domain redirects here; naming the canonical stops the two
  // being treated as competing copies of the same page.
  alternates: { canonical: "/" },
  title: {
    default: "Navey — Navigate Good Spots Nearby",
    template: "%s | Navey",
  },
  description:
    "Discover coffee shops and restaurants worth the trip across the Philippines, curated by people who actually go there. Real reviews, real photos, real spots.",
  keywords: [
    "coffee shops Philippines",
    "restaurants Philippines",
    "cafe finder",
    "Philippines food guide",
    "hidden gems Philippines",
  ],
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "Navey",
    title: "Navey — Navigate Good Spots Nearby",
    description:
      "Discover coffee shops and restaurants worth the trip across the Philippines, curated by people who actually go there.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Navey — Navigate Good Spots Nearby",
    description:
      "Discover coffee shops and restaurants worth the trip across the Philippines.",
  },
  /**
   * Proves to Google Search Console that we own this domain.
   *
   * Read from the environment rather than written in here, so the token can be
   * pasted into Vercel's settings without editing code -- and so this file
   * carries no secret. Left unset, the tag is simply absent and nothing breaks.
   *
   * Note that a value set in Vercel only appears after the next deployment,
   * because this metadata is baked into the build. Verifying by DNS TXT record
   * instead needs no deployment at all; see OPERATIONS.md.
   */
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        {/* Carries anything saved before signing up into the new account. */}
        <GuestSaveImporter />
        {/*
          Visitor counts.
          Worth writing down what this costs, given the year this project has
          had: the beacon goes to Vercel's own collector, not to a function of
          ours, so it does not touch the CPU or invocation allowances that ran
          out in August. It has its own separate monthly event quota on the free
          plan. About a kilobyte of script.
          It is here because promoting a site with no way to see what happened
          teaches nothing, and that was the real blocker on launching.
        */}
        <Analytics />
      </body>
    </html>
  );
}
