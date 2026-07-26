import Link from "next/link";
import { createListingAsAdmin } from "@/app/admin/actions";
import { SubmitSpotForm } from "@/components/SubmitSpotForm";
import { getTags } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminAddListingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const success = typeof params.success === "string" ? params.success : undefined;
  const spotId = typeof params.spotId === "string" ? params.spotId : undefined;

  const tags = success ? [] : await getTags();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/listings"
        className="text-sm font-semibold hover:opacity-60"
      >
        ← Manage Listings
      </Link>

      {success ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-white p-10 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
          <span className="text-5xl" aria-hidden>
            🎉
          </span>
          <h1 className="font-heading text-2xl font-extrabold">
            {success} is live
          </h1>
          <p className="text-sm text-navey-ink/70">
            It went straight to approved — you&apos;re listed as its owner,
            so you can add hours, payment methods, and more from your Owner
            Dashboard.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/admin/listings/new"
              className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
            >
              Add Another
            </Link>
            {spotId && (
              <Link
                href={`/owner/${spotId}`}
                className="rounded-full bg-navey-band px-5 py-2 text-sm font-bold hover:bg-navey-band/80"
              >
                Manage Details
              </Link>
            )}
            {spotId && (
              <Link
                href={`/spots/${spotId}`}
                className="rounded-full bg-navey-band px-5 py-2 text-sm font-bold hover:bg-navey-band/80"
              >
                View Live Page
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <h1 className="mt-4 font-heading text-3xl font-extrabold">
            Add Spot
          </h1>
          <p className="mt-2 text-sm text-navey-ink/60">
            Goes live immediately — no review queue. You&apos;ll be listed as
            the owner, so you can fill in hours, payments, and photos
            afterward from the Owner Dashboard.
          </p>
          <div className="mt-8">
            <SubmitSpotForm
              tags={tags}
              error={error}
              action={createListingAsAdmin}
              submitLabel="Add Spot"
              footnote={null}
            />
          </div>
        </>
      )}
    </div>
  );
}
