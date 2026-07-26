"use client";

import { useFormStatus } from "react-dom";
import { updateProfileInfo } from "@/app/settings/actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save Profile"}
    </button>
  );
}

export function ProfileInfoForm({
  displayName,
  handle,
}: {
  displayName: string;
  handle: string;
}) {
  return (
    <form action={updateProfileInfo} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="displayName" className="text-sm font-semibold">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          defaultValue={displayName}
          className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="handle" className="text-sm font-semibold">
          Handle (optional)
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-navey-ink/40">
            @
          </span>
          <input
            id="handle"
            name="handle"
            type="text"
            defaultValue={handle}
            placeholder="yourname"
            className="w-full rounded-full border border-black/10 py-3 pl-8 pr-4 text-sm outline-none focus:border-navey-ink"
          />
        </div>
      </div>

      <SaveButton />
    </form>
  );
}
