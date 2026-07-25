"use client";

import { useFormStatus } from "react-dom";
import { submitBusinessClaim } from "@/app/spots/[id]/claim/actions";

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
          className="w-full rounded-xl border-2 border-dashed border-black/20 px-4 py-3 text-sm outline-none"
        />
        <p className="mt-1.5 text-xs text-navey-ink/50">
          DTI/SEC registration, business permit, or a utility bill. Speeds up
          review, but not required to submit.
        </p>
      </div>

      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}

      <SubmitButton />
    </form>
  );
}
