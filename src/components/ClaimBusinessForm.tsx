"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitBusinessClaim } from "@/app/spots/[id]/claim/actions";
import {
  MAX_UPLOAD_TOTAL_BYTES,
  UPLOAD_LIMIT_LABEL,
  formatBytes,
} from "@/lib/upload-limits";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Submit for verification"}
    </button>
  );
}

export function ClaimBusinessForm({
  spotId,
  spotSummary,
  defaultName,
  defaultEmail,
  error,
}: {
  spotId: string;
  spotSummary: string;
  defaultName: string;
  defaultEmail: string;
  error?: string;
}) {
  // A scanned permit is routinely larger than a request is allowed to be, and
  // going over kills the page rather than returning an error. Clearing the
  // input keeps the form submittable -- proof is optional anyway.
  const [tooLarge, setTooLarge] = useState<string | null>(null);

  function checkProof(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file && file.size > MAX_UPLOAD_TOTAL_BYTES) {
      setTooLarge(formatBytes(file.size));
      event.target.value = "";
      return;
    }
    setTooLarge(null);
  }

  return (
    <form
      action={submitBusinessClaim}
      className="mt-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
    >
      <input type="hidden" name="spotId" value={spotId} />

      <div>
        <p className="mb-1.5 text-xs font-bold">Business</p>
        <p className="rounded-xl bg-navey-band px-4 py-3 text-sm">
          {spotSummary}
        </p>
      </div>

      <div>
        <label htmlFor="claimantName" className="mb-1.5 block text-xs font-bold">
          Your name
        </label>
        <input
          id="claimantName"
          name="claimantName"
          type="text"
          required
          defaultValue={defaultName}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
        />
      </div>

      <div>
        <label htmlFor="claimantEmail" className="mb-1.5 block text-xs font-bold">
          Email
        </label>
        <input
          id="claimantEmail"
          name="claimantEmail"
          type="email"
          required
          defaultValue={defaultEmail}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
        />
      </div>

      <div>
        <label htmlFor="proof" className="mb-1.5 block text-xs font-bold">
          Proof of ownership (optional)
        </label>
        <input
          id="proof"
          name="proof"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={checkProof}
          className="w-full rounded-xl border-2 border-dashed border-black/20 px-4 py-3 text-sm outline-none"
        />
        {tooLarge && (
          <p
            role="alert"
            className="mt-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
          >
            That file is {tooLarge} — the limit is {UPLOAD_LIMIT_LABEL}. Send a
            photo of the document instead, or submit without it and we&apos;ll
            ask for proof by email.
          </p>
        )}
        <p className="mt-1.5 text-xs text-navey-ink/50">
          DTI/SEC registration, business permit, or a utility bill. Speeds up
          review, but not required to submit. Max {UPLOAD_LIMIT_LABEL}.
        </p>
      </div>

      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}

      <SubmitButton />
    </form>
  );
}
