import Image from "next/image";

/**
 * The face of a saved list.
 *
 * It used to be an empty panel with a small map emoji in the middle, which
 * told you nothing and looked like a placeholder someone forgot to finish. A
 * list of real places should look like the places, so it shows their photos --
 * one filling the frame, or a mosaic of up to four.
 *
 * The empty state is kept deliberately different rather than reusing the same
 * emoji: "you have not saved anything yet" and "here are your saves" should
 * never look alike.
 */
export function SavedListCover({
  covers,
  name,
}: {
  covers: string[];
  name: string;
}) {
  if (covers.length === 0) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl bg-navey-band">
        <span className="text-3xl opacity-40" aria-hidden>
          🤍
        </span>
        <span className="text-xs font-semibold text-navey-ink/45">
          Nothing saved yet
        </span>
      </div>
    );
  }

  return (
    <div className="relative grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl bg-navey-band">
      {covers.slice(0, 4).map((url, index) => (
        <div
          key={url}
          className={`relative overflow-hidden ${
            // One photo fills the frame; three put the newest save large on the
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
