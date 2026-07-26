"use client";

import { useFormStatus } from "react-dom";
import { deleteListing } from "@/app/admin/actions";

function ConfirmDeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (
          !confirm(
            "Permanently delete this listing? This also removes its reviews, photos, and saves. This cannot be undone."
          )
        ) {
          event.preventDefault();
        }
      }}
      className="rounded-full bg-red-100 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete Listing Permanently"}
    </button>
  );
}

export function DeleteListingButton({ spotId }: { spotId: string }) {
  return (
    <form action={deleteListing}>
      <input type="hidden" name="id" value={spotId} />
      <ConfirmDeleteButton />
    </form>
  );
}
