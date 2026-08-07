"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/sign-in/actions";
import { useViewer } from "@/lib/use-viewer";

const NAV_LINKS = [
  { href: "/explore", label: "Explore", icon: "🔍" },
  { href: "/collections", label: "Collections", icon: "🗂️" },
  { href: "/explore/map", label: "Map", icon: "🗺️" },
  { href: "/community", label: "Community", icon: "👥" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/submit-a-spot", label: "Submit a Spot", icon: "➕" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  // Resolved here rather than passed down, so the header wrapping this menu
  // stays identical for every visitor and the page can be cached.
  const viewer = useViewer();
  const isSignedIn = viewer.status === "signed-in";
  const isAdmin = viewer.status === "signed-in" && viewer.isAdmin;
  const displayName = viewer.status === "signed-in" ? viewer.displayName : null;

  // Stop the page scrolling behind the open panel.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 active:bg-white"
      >
        <span aria-hidden className="text-lg">
          {open ? "✕" : "☰"}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[68px] z-40 bg-black/20"
          />
          <nav className="fixed inset-x-0 top-[68px] z-50 max-h-[calc(100dvh-68px)] overflow-y-auto border-b border-black/5 bg-navey-yellow px-6 pb-8 pt-2 shadow-[0_16px_32px_rgba(20,18,11,0.16)]">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 border-b border-black/5 py-4 text-base font-semibold active:opacity-60"
                  >
                    <span aria-hidden>{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {isSignedIn ? (
              <div className="mt-5 flex flex-col gap-3">
                {displayName && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-navey-ink/50">
                    Signed in as {displayName}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-bold"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/owner"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-bold"
                  >
                    My Spots
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-bold"
                  >
                    Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-navey-ink/10 px-5 py-2.5 text-sm font-bold"
                    >
                      Admin
                    </Link>
                  )}
                </div>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-navey-ink px-5 py-3 text-sm font-bold text-navey-yellow"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="mt-5 block rounded-full bg-navey-ink px-5 py-3 text-center text-sm font-bold text-navey-yellow"
              >
                Sign in
              </Link>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
