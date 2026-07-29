import Link from "next/link";
import { getAdminReviews } from "@/lib/admin";
import { deleteReview, keepReview } from "@/app/admin/reviews/actions";
import { DeleteReviewButton } from "@/components/DeleteReviewButton";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;
  const error = typeof query.error === "string" ? query.error : undefined;
  const onlyFlagged = query.filter === "flagged";

  const reviews = await getAdminReviews(onlyFlagged);
  const back = onlyFlagged ? "/admin/reviews?filter=flagged" : "/admin/reviews";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-3xl font-extrabold">Reviews</h1>
      <p className="mt-2 text-sm text-navey-ink/60">
        {reviews.length} review{reviews.length === 1 ? "" : "s"}
        {onlyFlagged ? " needing attention" : ""}
      </p>

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

      <div className="mt-6 flex gap-1 rounded-full bg-white p-1 shadow-[0_4px_16px_rgba(20,18,11,0.05)] w-fit">
        <Link
          href="/admin/reviews"
          className={`rounded-full px-4 py-1.5 text-xs font-bold ${
            onlyFlagged ? "text-navey-ink/60" : "bg-navey-ink text-navey-yellow"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/reviews?filter=flagged"
          className={`rounded-full px-4 py-1.5 text-xs font-bold ${
            onlyFlagged ? "bg-navey-ink text-navey-yellow" : "text-navey-ink/60"
          }`}
        >
          Needs attention
        </Link>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-10 text-sm text-navey-ink/60">
          {onlyFlagged
            ? "Nothing flagged — nothing to do."
            : "No reviews yet."}
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className={`rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(20,18,11,0.05)] ${
                review.needsReview ? "ring-2 ring-amber-300" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/spots/${review.spotId}`}
                    className="font-heading text-sm font-bold hover:opacity-60"
                  >
                    {review.spotName}
                  </Link>
                  <p className="text-xs text-navey-ink/55">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)} ·{" "}
                    {review.authorName ?? "Deleted user"}
                  </p>
                </div>
                {review.needsReview && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                    {review.reportCount > 0
                      ? `${review.reportCount} report${review.reportCount === 1 ? "" : "s"}`
                      : "Auto-flagged"}
                  </span>
                )}
              </div>

              {review.body && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-navey-ink/80">
                  {review.body}
                </p>
              )}

              {review.reportReasons.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                  {review.reportReasons.map((reason, position) => (
                    <li key={position}>“{reason}”</li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {review.needsReview && (
                  <form action={keepReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="back" value={back} />
                    <button
                      type="submit"
                      className="rounded-full bg-navey-band px-4 py-2 text-xs font-bold hover:bg-navey-band/70"
                    >
                      Keep — it&apos;s fine
                    </button>
                  </form>
                )}
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <input type="hidden" name="back" value={back} />
                  <DeleteReviewButton author={review.authorName ?? "this user"} />
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
