"use client";

import { useEffect, useState } from "react";
import {
  closingSoonLabel,
  openDetail,
  type OpenHourRow,
  type OpenState,
} from "@/lib/open-status";

/**
 * Open, closed, or nothing -- worked out in the visitor's browser.
 *
 * This used to take a state that the server had already decided. That was
 * correct while every page was built per request, and became wrong the moment
 * the pages were cached: with `revalidate` at a week, an "Open now" badge is
 * whatever was true when the page was last built, which can be six days ago.
 * A directory that confidently says a shop is open when it is shut has lost
 * the only thing it was selling.
 *
 * So the hours travel to the browser and the answer is worked out there,
 * against the visitor's own clock, and re-checked every minute so a page left
 * open over closing time corrects itself. The server's value is still used for
 * the first paint, which keeps the badge from popping in and gives crawlers
 * something to read -- it is simply not trusted for longer than it takes the
 * effect to run.
 *
 * Nothing is rendered when the state is unknown. A spot with thin hours data
 * gets no badge rather than a confident "Closed" that would send someone
 * elsewhere -- the absence reads as "we don't know", which is the truth.
 */
export function OpenBadge({
  hours,
  initialState,
  className = "",
  showClosingSoon = true,
}: {
  hours: OpenHourRow[];
  /** What the server worked out when the page was built. First paint only. */
  initialState: OpenState;
  className?: string;
  /** Cards in a dense grid leave this off; there is only room for one fact. */
  showClosingSoon?: boolean;
}) {
  const [detail, setDetail] = useState(() => ({
    state: initialState,
    minutesUntilClose: null as number | null,
  }));

  useEffect(() => {
    const recalculate = () => setDetail(openDetail(hours, new Date()));
    recalculate();

    // A minute is fine: the badge only ever changes on a minute boundary, and
    // this is a timer in the visitor's browser, not work on a server.
    const timer = setInterval(recalculate, 60_000);
    return () => clearInterval(timer);
  }, [hours]);

  if (detail.state === "unknown") return null;

  const isOpen = detail.state === "open";
  const closing = showClosingSoon ? closingSoonLabel(detail) : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        closing
          ? // Closing soon is neither of the two states it sits between, and
            // should not be mistaken for either at a glance.
            "bg-amber-600 text-white"
          : isOpen
            ? "bg-green-600 text-white"
            : "bg-navey-ink/75 text-white"
      } ${className}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          isOpen ? "bg-white" : "bg-white/70"
        }`}
      />
      {closing ?? (isOpen ? "Open now" : "Closed")}
    </span>
  );
}
