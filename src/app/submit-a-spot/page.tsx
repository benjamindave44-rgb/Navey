import Link from "next/link";
import { getAreaDirectory } from "@/lib/areas";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubmitSpotForm } from "@/components/SubmitSpotForm";
import { getTags } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase-server";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Spot",
  description:
    "Know a coffee shop or restaurant worth the trip? Add it to Navey so others can find it.",
  alternates: { canonical: "/submit-a-spot" },
};

export const dynamic = "force-dynamic";

export default async function SubmitASpotPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const success = typeof params.success === "string" ? params.success : undefined;

  const tags = success ? [] : await getTags();
  const districts = (await getAreaDirectory()).map((area) => area.district);

  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-2xl">
          {success ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
              <span className="text-5xl" aria-hidden>
                🎉
              </span>
              <h1 className="font-heading text-2xl font-extrabold">
                {success} was submitted!
              </h1>
              <p className="text-sm text-navey-ink/70">
                Thanks for contributing. Our team reviews new spots before
                they go live — we&apos;ll let you know once it&apos;s
                approved.
              </p>
              <div className="mt-2 flex gap-3">
                <Link
                  href="/submit-a-spot"
                  className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
                >
                  Submit Another
                </Link>
                <Link
                  href="/explore"
                  className="rounded-full bg-navey-band px-5 py-2 text-sm font-bold hover:bg-navey-band/80"
                >
                  Back to Explore
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-heading text-3xl font-extrabold">
                Submit a Spot
              </h1>
              <p className="mt-2 text-sm text-navey-ink/60">
                Know a coffee shop or restaurant worth the trip? Add it to
                Navey.
              </p>
              <div className="mt-8">
                <SubmitSpotForm
                  tags={tags}
                  knownDistricts={districts}
                  error={error}
                />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
