import type { OpenState } from "@/lib/open-status";

/**
 * Nothing is rendered when the state is unknown. A spot with thin hours data
 * gets no badge rather than a confident "Closed" that would send someone
 * elsewhere -- the absence reads as "we don't know", which is the truth.
 */
export function OpenBadge({
  state,
  className = "",
}: {
  state: OpenState;
  className?: string;
}) {
  if (state === "unknown") return null;

  const isOpen = state === "open";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        isOpen
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
      {isOpen ? "Open now" : "Closed"}
    </span>
  );
}
