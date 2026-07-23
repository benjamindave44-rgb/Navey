import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-black/5 bg-navey-yellow px-6 py-4 md:px-12">
      <Link href="/" className="flex items-center gap-3">
        <span className="font-heading text-3xl font-extrabold tracking-tight">
          NAVEY
        </span>
      </Link>
      <nav className="hidden items-center gap-9 text-sm font-semibold md:flex">
        <Link href="/explore" className="hover:opacity-60">
          Explore
        </Link>
        <span className="text-navey-ink/40">Collections</span>
        <span className="text-navey-ink/40">Community</span>
        <span className="text-navey-ink/40">About</span>
      </nav>
      <Link
        href="/sign-in"
        className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
      >
        Sign in
      </Link>
    </header>
  );
}
