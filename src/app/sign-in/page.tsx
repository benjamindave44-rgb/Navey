import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignInForm } from "@/components/SignInForm";
import { SignInShowcase, type ShowcaseSpot } from "@/components/SignInShowcase";
import { getCityDirectory } from "@/lib/cities";
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

  const [featured, spotCount, cities] = await Promise.all([
    getFeaturedSpots(12),
    countApprovedSpots(),
    getCityDirectory(),
  ]);

  // Five is enough to feel alive without five sets of dots to read. Only spots
  // with a photo qualify: a blank frame in the rotation looks like a fault.
  const showcase: ShowcaseSpot[] = featured
    .filter((spot) => spot.coverPhoto)
    .slice(0, 5)
    .map((spot) => ({
      id: spot.id,
      name: spot.name,
      city: spot.city,
      photo: spot.coverPhoto!,
    }));

  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <div className="grid md:min-h-[calc(100vh-140px)] md:grid-cols-2">
          <div className="flex flex-col justify-center px-5 py-8 sm:px-6 md:px-16 md:py-20">
            <SignInForm initialMode={mode} error={error} notice={notice} />
          </div>

          {/* Above the form on a phone, beside it on a laptop. It used to be
              hidden below the medium breakpoint entirely, so the visitors most
              likely to be on a phone got a bare form on an empty page and no
              answer to what they were joining. */}
          <div className="order-first h-52 sm:h-64 md:order-none md:h-auto">
            <SignInShowcase
              spots={showcase}
              spotCount={spotCount}
              cityCount={cities.length}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
