/**
 * Every page renders on demand, so navigation otherwise sits on the old
 * screen with no sign anything is happening. A skeleton in the site's own
 * colours reads as loading rather than as a fault.
 */
export default function Loading() {
  return (
    <div className="flex-1 px-4 py-10 sm:px-6 md:px-12" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-48 animate-pulse rounded-full bg-navey-band" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded-full bg-navey-band/70" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((tile) => (
          <div key={tile} className="navey-arch-card overflow-hidden bg-white">
            <div className="aspect-[4/3] animate-pulse bg-navey-band" />
            <div className="flex flex-col gap-2 p-3">
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-navey-band" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-navey-band/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
