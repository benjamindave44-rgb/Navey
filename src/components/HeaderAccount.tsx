"use client";

import Link from "next/link";
import { signOutAction } from "@/app/sign-in/actions";
import { useViewer } from "@/lib/use-viewer";

/**
 * The only part of the header that differs between people. Kept in the browser
 * so the header around it -- and therefore every page carrying it -- is
 * identical for everybody and can be cached.
 */
export function HeaderAccount() {
  const viewer = useViewer();

  // Same width as the signed-in controls, so the header does not jump when the
  // answer arrives a moment later.
  if (viewer.status === "loading") {
    return <div className="hidden h-10 w-[150px] md:block" aria-hidden />;
  }

  if (viewer.status === "signed-out") {
    return (
      <Link
        href="/sign-in"
        className="hidden rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 md:block"
      >
        Sign in
      </Link>
    );
  }

  const initial = viewer.displayName.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="hidden items-center gap-2 md:flex">
      {viewer.isAdmin && (
        <Link
          href="/admin"
          className="rounded-full bg-navey-ink/10 px-4 py-2 text-sm font-bold hover:bg-navey-ink/20"
        >
          Admin
        </Link>
      )}
      <Link
        href="/profile"
        aria-label="Your profile"
        title={viewer.displayName || undefined}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-navey-ink text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
      >
        {initial}
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold hover:bg-white/80"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
