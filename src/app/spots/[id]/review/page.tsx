import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WriteReviewForm } from "@/components/WriteReviewForm";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function WriteReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: spot } = await supabase
    .from("spots")
    .select("id, name, city")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!spot) notFound();

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("rating, body")
    .eq("spot_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <Header />
      <main className="flex-1 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-xl">
          <h1 className="font-heading text-3xl font-extrabold">
            {existingReview ? "Edit your review" : "Write a Review"}
          </h1>
          <p className="mt-2 text-sm text-navey-ink/60">
            {spot.name} · {spot.city}
          </p>
          <div className="mt-8">
            <WriteReviewForm
              spotId={spot.id}
              initialRating={existingReview?.rating ?? 0}
              initialBody={existingReview?.body ?? ""}
              error={error}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
