"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitReview } from "@/app/spots/[id]/review/actions";
import { PhotoPicker } from "@/components/PhotoPicker";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Submitting…" : label}
    </button>
  );
}

export function WriteReviewForm({
  spotId,
  initialRating,
  initialBody,
  error,
}: {
  spotId: string;
  initialRating: number;
  initialBody: string;
  error?: string;
}) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const activeRating = hoverRating || rating;

  return (
    <form action={submitReview} className="flex flex-col gap-6">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <input type="hidden" name="spotId" value={spotId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <p className="mb-2 text-sm font-semibold">Your rating</p>
        <div className="flex gap-1 text-3xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              className="leading-none"
            >
              <span
                aria-hidden
                className={activeRating >= star ? "text-amber-400" : "text-navey-ink/20"}
              >
                ★
              </span>
            </button>
          ))}
        </div>
        {rating === 0 && (
          <p className="mt-1 text-xs text-navey-ink/50">
            Tap a star to rate your visit.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="body" className="text-sm font-semibold">
          Your review
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          defaultValue={initialBody}
          placeholder="How was the coffee, the vibe, the service?"
          className="rounded-2xl border border-black/10 px-4 py-3 text-base sm:text-sm outline-none focus:border-navey-ink"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Photos</p>
        <PhotoPicker name="photos" max={4} />
      </div>

      <SubmitButton label={initialRating ? "Update Review" : "Submit Review"} />
    </form>
  );
}
