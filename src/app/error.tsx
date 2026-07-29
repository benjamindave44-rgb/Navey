"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Without this, an unhandled error shows the framework's own crash screen --
 * unbranded, with no way back into the site.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keeps the digest in the server logs so a report can be traced.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span aria-hidden className="text-5xl">
        ☕
      </span>
      <h1 className="mt-4 font-heading text-2xl font-extrabold">
        Something spilled
      </h1>
      <p className="mt-2 max-w-sm text-sm text-navey-ink/70">
        That page didn&apos;t load properly. It&apos;s us, not you — try again,
        or head back and take another route.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full bg-navey-band px-6 py-3 text-sm font-bold hover:bg-navey-band/70"
        >
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-navey-ink/40">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
