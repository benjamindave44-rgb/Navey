import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OwnerSpotTabs } from "@/components/OwnerSpotTabs";
import { getOwnerSpotDetail } from "@/lib/owner";
import { getTags } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function OwnerSpotPage({
  params,
  searchParams,
}: {
  params: Promise<{ spotId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { spotId } = await params;
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;
  const error = typeof query.error === "string" ? query.error : undefined;
  const initialTab = typeof query.tab === "string" ? query.tab : "overview";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const [spot, tags] = await Promise.all([
    getOwnerSpotDetail(user.id, spotId),
    getTags(),
  ]);

  if (!spot) notFound();

  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-3xl">
          <Link href="/owner" className="text-sm font-semibold hover:opacity-60">
            ← My Spots
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-extrabold">
                {spot.name}
              </h1>
              <p className="text-sm text-navey-ink/60">
                Status: <span className="capitalize">{spot.status}</span>
                {spot.needsReview && (
                  <span className="ml-2 text-amber-600">
                    · Flagged for review
                  </span>
                )}
              </p>
            </div>
            <Link
              href={`/spots/${spot.id}`}
              className="rounded-full bg-navey-band px-4 py-2 text-sm font-bold hover:bg-navey-band/80"
            >
              View Live Page
            </Link>
          </div>

          {notice && (
            <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {notice}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-8">
            <OwnerSpotTabs spot={spot} tags={tags} initialTab={initialTab} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
