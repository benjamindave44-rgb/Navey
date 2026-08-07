import Link from "next/link";
import { getAreaDirectory } from "@/lib/areas";
import { notFound } from "next/navigation";
import { AdminListingForm } from "@/components/AdminListingForm";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { getAdminSpotDetail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;
  const error = typeof query.error === "string" ? query.error : undefined;

  const spot = await getAdminSpotDetail(id);
  const districts = (await getAreaDirectory()).map((area) => area.district);
  if (!spot) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/listings"
        className="text-sm font-semibold hover:opacity-60"
      >
        ← Manage Listings
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">{spot.name}</h1>
          <p className="text-sm text-navey-ink/60">
            Submitted by {spot.submitterName ?? "unknown"}
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
        <AdminListingForm spot={spot} knownDistricts={districts} />
      </div>

      <div className="mt-10 border-t border-black/10 pt-6">
        <p className="mb-3 text-sm font-semibold text-red-700">Danger zone</p>
        <DeleteListingButton spotId={spot.id} />
      </div>
    </div>
  );
}
