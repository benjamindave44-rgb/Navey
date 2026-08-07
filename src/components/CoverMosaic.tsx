import Image from "next/image";

/**
 * The face of a group of places -- a saved list, a curated collection.
 *
 * Both used to be an empty panel with a small emoji floating in the middle,
 * which said nothing about what was inside and read as a placeholder someone
 * forgot to finish. A group of real coffee shops should look like the coffee
 * shops, so it shows their photos: one filling the frame, or a mosaic of up
 * to four.
 *
 * The empty state is deliberately not the same emoji on the same panel.
 * "There is nothing in here" and "here is what is in here" must never look
 * alike, which was the actual bug in the old design.
 *
 * Put the caller's own placement classes on the wrapping element; this fills
 * whatever box it is given.
 */
export function CoverMosaic({
  covers,
  name,
  emptyIcon = "🤍",
  emptyLabel = "Nothing saved yet",
  // Cards that inset their cover want it rounded; cards where it runs edge to
  // edge already have the corner shape on the card itself.
  rounded = true,
}: {
  covers: string[];
  name: string;
  emptyIcon?: string;
  emptyLabel?: string;
  rounded?: boolean;
}) {
  const corners = rounded ? "rounded-xl" : "";
  if (covers.length === 0) {
    return (
      <div className={`flex aspect-[4/3] flex-col items-center justify-center gap-1 bg-navey-band ${corners}`}>
        <span className="text-3xl opacity-40" aria-hidden>
          {emptyIcon}
        </span>
        <span className="text-xs font-semibold text-navey-ink/45">
          {emptyLabel}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden bg-navey-band ${corners}`}>
      {covers.slice(0, 4).map((url, index) => (
        <div
          key={url}
          className={`relative overflow-hidden ${
            // One photo fills the frame; three put the first one large on the
            // left so the tile never reads as a broken four-up.
            covers.length === 1
              ? "col-span-2 row-span-2"
              : covers.length === 2
                ? "row-span-2"
                : covers.length === 3 && index === 0
                  ? "row-span-2"
                  : ""
          }`}
        >
          <Image
            src={url}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, 220px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ))}

      <span className="sr-only">{name}</span>
    </div>
  );
}
