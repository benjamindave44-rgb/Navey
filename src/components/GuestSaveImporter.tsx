"use client";

import { useEffect, useRef } from "react";
import { importGuestSaves } from "@/app/spots/actions";
import { clearGuestSaves, guestSavedIds } from "@/lib/guest-saves";
import { forgetSavedSpots } from "@/lib/use-saved-spots";
import { useViewer } from "@/lib/use-viewer";

/**
 * Moves the saves somebody made before signing up into their new account.
 *
 * Without this, saving while signed out is a trap: the hearts fill, the visitor
 * signs up, and the list they were building disappears -- which is worse than
 * never having offered it. The whole point of guest saves is that the account is
 * how you keep them.
 *
 * Mounted once, in the root layout. Runs only on the transition into a
 * signed-in state and only when there is something to move, so the ordinary
 * case is a read of localStorage and nothing else.
 */
export function GuestSaveImporter() {
  const viewer = useViewer();
  // One import per page life. Without this, anything that re-runs the effect --
  // a token refresh firing onAuthStateChange, say -- would fire a second
  // import while the first was still going.
  const done = useRef(false);

  useEffect(() => {
    if (viewer.status !== "signed-in" || done.current) return;

    const pending = guestSavedIds();
    if (pending.length === 0) {
      // Nothing to move, but this browser is now signed in, so the guest list
      // has no further job. Marked done either way.
      done.current = true;
      return;
    }

    done.current = true;

    importGuestSaves(pending).then((result) => {
      if (result.status !== "done") {
        // Left in place deliberately. A failed import that clears the list
        // loses the saves for good; leaving them means the next page load tries
        // again.
        done.current = false;
        return;
      }

      clearGuestSaves();
      // The saved list was fetched before the import; drop it so the hearts
      // read the account rather than a copy taken a moment too early.
      forgetSavedSpots();
    });
  }, [viewer.status]);

  return null;
}
