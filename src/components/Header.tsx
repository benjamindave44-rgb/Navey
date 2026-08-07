import Image from "next/image";
import Link from "next/link";
import { HeaderAccount } from "@/components/HeaderAccount";
import { MobileMenu } from "@/components/MobileMenu";

/**
 * Identical for every visitor, on purpose. This header sits on every page, so
 * for as long as it asked the server who was signed in, no page on the site
 * could be cached -- each one had to be rebuilt per person to render this one
 * corner. The parts that differ now resolve in the browser instead.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-[68px] items-center justify-between border-b border-black/5 bg-navey-yellow px-4 md:h-auto md:px-12 md:py-4">
      <Link href="/" className="flex items-center gap-2 md:gap-4">
        <Image
          src="/navey-icon.png"
          alt="Navey"
          width={88}
          height={88}
          priority
          className="h-10 w-10 md:h-[88px] md:w-[88px]"
        />
        <span className="font-heading text-2xl font-extrabold tracking-tight md:text-5xl">
          NAVEY
        </span>
      </Link>
      <nav className="hidden items-center gap-9 text-sm font-semibold md:flex">
        <Link href="/explore" className="hover:opacity-60">
          Explore
        </Link>
        <Link href="/collections" className="hover:opacity-60">
          Collections
        </Link>
        <Link href="/explore/map" className="hover:opacity-60">
          Map
        </Link>
        <Link href="/community" className="hover:opacity-60">
          Community
        </Link>
        <Link href="/leaderboard" className="hover:opacity-60">
          Leaderboard
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="Saved places"
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/70 text-lg hover:bg-white md:flex"
        >
          <span aria-hidden>♡</span>
        </Link>
        <MobileMenu />
        <HeaderAccount />
      </div>
    </header>
  );
}
