import type { NextConfig } from "next";

// Spot photos are served from Supabase Storage; derive the host from the
// configured project URL so this keeps working across environments.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  images: {
    /**
     * Keep a resized photo for a year instead of re-making it every hour.
     *
     * Without this, Next follows whatever cache time the photo's host sends,
     * and Supabase Storage sends about an hour -- so the same coffee shop
     * photo was being resized again and again for as long as anyone kept
     * looking at it. Opening the admin listing grid alone re-processed every
     * thumbnail on the site once an hour. Resizes are metered, and that is
     * what took the allowance from a third to three quarters in twelve days.
     *
     * Safe here because uploaded photos get a unique random filename
     * (see src/lib/photo-upload.ts): a replaced photo arrives at a new
     * address, so nothing can be served stale.
     */
    minimumCacheTTL: 31536000,

    /**
     * Every width listed here is a separate resize of every photo, and the
     * defaults offer sixteen of them. These cover phones, tablets and
     * desktops with room to spare; the cost of the gaps is that a screen
     * occasionally gets a slightly wider image than it strictly needs, which
     * is a few kilobytes and invisible.
     */
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [64, 128, 256],

    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
