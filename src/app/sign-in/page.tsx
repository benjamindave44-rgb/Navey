import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignInForm } from "@/components/SignInForm";
import { countApprovedSpots, getFeaturedSpots } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase-server";

import type { Metadata } from "next";

// Account and form pages carry no search value, and some expose a person's
// own data. robots.txt only asks crawlers to skip a path; this is what keeps
// the page out of results if it is ever linked from elsewhere.
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  const params = await searchParams;
  const mode = params.mode === "signup" ? "signup" : "signin";
  const error = typeof params.error === "string" ? params.error : undefined;
  const notice = typeof params.notice === "string" ? params.notice : undefined;

  // Six is what the panel's grid shows. Only spots that actually have a photo
  // qualify -- a gap in the mosaic looks like a fault, not like a shorter list.
  const [featured, spotCount] = await Promise.all([
    getFeaturedSpots(12),
    countApprovedSpots(),
  ]);
  const showcase = featured
    .map((spot) => spot.coverPhoto)
    .filter((url): url is string => Boolean(url))
    .slice(0, 6);

  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-12 md:px-16 md:py-20">
            <Link href="/" className="mb-10 inline-flex items-center gap-2">
              <Image
                src="/navey-icon.png"
                alt="Navey"
                width={44}
                height={44}
                className="h-11 w-11"
              />
              <span className="font-heading text-2xl font-extrabold">
                NAVEY
              </span>
            </Link>
            <SignInForm initialMode={mode} error={error} notice={notice} />
          </div>
          {/* Real places, not a stock map. This panel is the only picture of
              what Navey is that someone sees before they commit to an
              account, and a large empty square with an emoji in it was
              answering "what am I joining?" with nothing. */}
          <div className="relative hidden flex-col items-center justify-center gap-4 overflow-hidden bg-navey-band px-12 py-20 text-center md:flex">
            {showcase.length > 0 && (
              <>
                <div
                  aria-hidden
                  className="absolute inset-0 grid grid-cols-2 gap-1"
                >
                  {showcase.map((url) => (
                    <div key={url} className="relative">
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 0px, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                {/* Deep enough that the words stay readable over any photo,
                    including a bright one. */}
                <div aria-hidden className="absolute inset-0 bg-navey-ink/70" />
              </>
            )}

            <div className="relative flex flex-col items-center gap-4">
              {showcase.length === 0 && (
                <span className="text-7xl" aria-hidden>
                  🗺️
                </span>
              )}
              <p
                className={`font-heading text-2xl font-extrabold ${
                  showcase.length > 0 ? "text-navey-yellow" : ""
                }`}
              >
                Navigate good spots, together
              </p>
              <p
                className={`max-w-xs text-sm ${
                  showcase.length > 0 ? "text-white/85" : "text-navey-ink/70"
                }`}
              >
                Save your favorites, write reviews, and help other explorers
                find the good stuff.
              </p>
              {showcase.length > 0 && (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                  {spotCount} spots and counting
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
