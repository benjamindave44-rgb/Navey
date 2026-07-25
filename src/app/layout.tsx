import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://www.navey.co"),
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
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
