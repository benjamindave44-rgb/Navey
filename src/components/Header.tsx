import Image from "next/image";
import Link from "next/link";
import { signOutAction } from "@/app/sign-in/actions";
import { MobileMenu } from "@/components/MobileMenu";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function Header() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? user.email ?? null;
    isAdmin = profile?.role === "admin";
  }

  const initial = displayName?.trim()?.[0]?.toUpperCase() ?? "?";

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
        <span className="text-navey-ink/40">Collections</span>
        <Link href="/explore/map" className="hover:opacity-60">
          Map
        </Link>
        <Link href="/community" className="hover:opacity-60">
          Community
        </Link>
        <span className="text-navey-ink/40">About</span>
      </nav>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Saved places"
          disabled
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/70 text-lg disabled:cursor-not-allowed md:flex"
        >
          <span aria-hidden>♡</span>
        </button>
        <MobileMenu
          isSignedIn={Boolean(user)}
          isAdmin={isAdmin}
          displayName={displayName}
        />
        {user ? (
          <div className="hidden items-center gap-2 md:flex">
            {isAdmin && (
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
              title={displayName ?? undefined}
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
        ) : (
          <Link
            href="/sign-in"
            className="hidden rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 md:block"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
