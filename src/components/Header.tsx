import Image from "next/image";
import Link from "next/link";
import { signOutAction } from "@/app/sign-in/actions";
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
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-black/5 bg-navey-yellow px-6 py-4 md:px-12">
      <Link href="/" className="flex items-center gap-4">
        <Image
          src="/navey-icon.png"
          alt="Navey"
          width={88}
          height={88}
          priority
          className="h-14 w-14 md:h-[88px] md:w-[88px]"
        />
        <span className="font-heading text-4xl font-extrabold tracking-tight md:text-5xl">
          NAVEY
        </span>
      </Link>
      <nav className="hidden items-center gap-9 text-sm font-semibold md:flex">
        <Link href="/explore" className="hover:opacity-60">
          Explore
        </Link>
        <span className="text-navey-ink/40">Collections</span>
        <span className="text-navey-ink/40">Map</span>
        <span className="text-navey-ink/40">Community</span>
        <span className="text-navey-ink/40">About</span>
      </nav>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Saved places"
          disabled
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-lg disabled:cursor-not-allowed"
        >
          <span aria-hidden>♡</span>
        </button>
        {user ? (
          <div className="flex items-center gap-2">
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
            className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
