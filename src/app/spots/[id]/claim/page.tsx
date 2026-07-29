import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClaimBusinessForm } from "@/components/ClaimBusinessForm";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function ClaimBusinessPage({
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

  const [{ data: spot }, { data: profile }, { data: existingClaim }] =
    await Promise.all([
      supabase
        .from("spots")
        .select("id, name, address, city, submitted_by")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle(),
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      supabase
        .from("business_claims")
        .select("id, status")
        .eq("spot_id", id)
        .eq("claimant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!spot) notFound();
  if (spot.submitted_by === user.id) redirect(`/spots/${id}`);

  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-xl">
          {existingClaim?.status === "pending" ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
              <div className="mb-3 text-4xl" aria-hidden>
                ✅
              </div>
              <h1 className="font-heading text-2xl font-extrabold">
                Claim submitted
              </h1>
              <p className="mt-2 text-sm text-navey-ink/65">
                Our team will verify your claim to{" "}
                <span className="font-bold">{spot.name}</span> within 1–2
                business days. You&apos;ll be able to manage this listing from
                your Owner Dashboard once it&apos;s approved.
              </p>
              <Link
                href={`/spots/${id}`}
                className="mt-6 inline-block rounded-full bg-navey-ink px-7 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
              >
                Back to {spot.name}
              </Link>
            </div>
          ) : existingClaim?.status === "rejected" ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
              <div className="mb-3 text-4xl" aria-hidden>
                ✉️
              </div>
              <h1 className="font-heading text-2xl font-extrabold">
                Claim not approved
              </h1>
              <p className="mt-2 text-sm text-navey-ink/65">
                Your previous claim to {spot.name} wasn&apos;t approved. If
                you believe this is a mistake, email us at{" "}
                <a href="mailto:navey.ph@gmail.com" className="font-bold">
                  navey.ph@gmail.com
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-navey-ink/50">
                For business owners
              </p>
              <h1 className="mt-2 font-heading text-3xl font-extrabold">
                Claim {spot.name}
              </h1>
              <p className="mt-2 text-sm text-navey-ink/65">
                Get a dashboard to manage this listing&apos;s menu, hours,
                payment methods, and photos. Our team verifies each claim
                before granting access.
              </p>

              <ClaimBusinessForm
                spotId={spot.id}
                spotSummary={`${spot.name} — ${spot.address}, ${spot.city}`}
                defaultName={profile?.display_name ?? ""}
                defaultEmail={user.email ?? ""}
                error={error}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
