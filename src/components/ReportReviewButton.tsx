"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reportReview } from "@/app/spots/report-actions";

export function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await reportReview(reviewId, reason);
      if (result.status === "unauthenticated") {
        router.push("/sign-in");
        return;
      }
      setOpen(false);
      setDone(
        result.status === "duplicate"
          ? "You've already reported this."
          : result.status === "error"
            ? "Couldn't send that. Try again."
            : "Thanks — we'll take a look."
      );
    });
  }

  if (done) {
    return <p className="mt-2 text-xs text-navey-ink/55">{done}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-semibold text-navey-ink/45 hover:text-navey-ink/80"
      >
        Report
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-xl bg-navey-band/60 p-3">
      <label htmlFor={`reason-${reviewId}`} className="text-xs font-semibold">
        What&apos;s wrong with this review? (optional)
      </label>
      <input
        id={`reason-${reviewId}`}
        type="text"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Spam, abusive, not about this place…"
        className="rounded-full border border-black/10 px-3 py-2 text-xs outline-none focus:border-navey-ink"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-full bg-navey-ink px-4 py-1.5 text-xs font-bold text-navey-yellow disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-navey-ink/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
