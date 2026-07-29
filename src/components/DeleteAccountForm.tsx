"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteAccount } from "@/app/settings/actions";

function ConfirmButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!enabled || pending}
      className="self-start rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? "Deleting…" : "Delete my account"}
    </button>
  );
}

export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 rounded-full border border-red-300 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form action={deleteAccount} className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/60 p-4">
      <p className="text-sm font-bold text-red-800">
        This permanently deletes your account.
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-red-800/90">
        <li>Your reviews and saved lists are removed and cannot be restored</li>
        <li>
          Spots you submitted stay on Navey, listed without a contributor
        </li>
        <li>You&apos;ll need to sign up again to use Navey</li>
      </ul>

      <label htmlFor="confirmation" className="text-sm font-semibold text-red-900">
        Type <span className="font-mono">DELETE</span> to confirm
      </label>
      <input
        id="confirmation"
        name="confirmation"
        type="text"
        autoComplete="off"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        placeholder="DELETE"
        className="w-48 rounded-full border border-red-300 px-4 py-2 text-sm outline-none focus:border-red-600"
      />

      <div className="flex flex-wrap items-center gap-3">
        <ConfirmButton enabled={confirmation.trim().toUpperCase() === "DELETE"} />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmation("");
          }}
          className="text-sm font-semibold text-navey-ink/70 hover:opacity-70"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
