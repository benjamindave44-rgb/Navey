import Link from "next/link";
import { approveClaim, rejectClaim } from "@/app/admin/actions";
import { getPendingClaims } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  const claims = await getPendingClaims();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-3xl font-extrabold">Business Claims</h1>
      <p className="mt-2 text-sm text-navey-ink/60">
        {claims.length} claim{claims.length === 1 ? "" : "s"} waiting for
        review
      </p>

      {claims.length === 0 ? (
        <p className="mt-10 text-sm text-navey-ink/60">
          Nothing pending — you&apos;re all caught up.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/spots/${claim.spotId}`}
                    className="font-heading text-lg font-bold hover:opacity-60"
                  >
                    {claim.spotName}
                  </Link>
                  <p className="text-sm text-navey-ink/60">{claim.spotCity}</p>
                  <p className="mt-2 text-sm">
                    Claimed by{" "}
                    <span className="font-semibold">{claim.claimantName}</span>{" "}
                    ·{" "}
                    <a
                      href={`mailto:${claim.claimantEmail}`}
                      className="font-semibold hover:underline"
                    >
                      {claim.claimantEmail}
                    </a>
                  </p>
                  <p className="mt-1 text-xs text-navey-ink/50">
                    Submitted {new Date(claim.createdAt).toLocaleDateString()}
                  </p>
                  {claim.proofUrl ? (
                    <a
                      href={claim.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block rounded-full bg-navey-band px-3 py-1.5 text-xs font-bold hover:bg-navey-band/70"
                    >
                      View proof document →
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-navey-ink/40">
                      No proof document attached
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={approveClaim}>
                    <input type="hidden" name="id" value={claim.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-navey-ink px-4 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectClaim}>
                    <input type="hidden" name="id" value={claim.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
