import Image from "next/image";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { createServerSupabaseClient } from "@/lib/supabase-server";

import type { Metadata } from "next";

// Account and form pages carry no search value, and some expose a person's
// own data. robots.txt only asks crawlers to skip a path; this is what keeps
// the page out of results if it is ever linked from elsewhere.
export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const done = params.done === "1";
  const error = typeof params.error === "string" ? params.error : undefined;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navey-yellow px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Image
            src="/navey-icon.png"
            alt="Navey"
            width={64}
            height={64}
            className="h-16 w-16"
          />
          <span className="font-heading text-2xl font-extrabold">NAVEY</span>
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-[0_12px_32px_rgba(20,18,11,0.1)]">
          {done ? (
            <div className="py-2 text-center">
              <div className="mb-3.5 text-4xl" aria-hidden>
                🔒
              </div>
              <h1 className="font-heading text-xl font-extrabold">
                Password updated
              </h1>
              <p className="mt-2 text-sm text-navey-ink/65">
                Your password has been changed successfully.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-full bg-navey-ink px-7 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
              >
                Continue to Navey
              </Link>
            </div>
          ) : !user ? (
            <div className="py-2 text-center">
              <div className="mb-3.5 text-4xl" aria-hidden>
                ⏰
              </div>
              <h1 className="font-heading text-xl font-extrabold">
                Link expired
              </h1>
              <p className="mt-2 text-sm text-navey-ink/65">
                This password reset link is invalid or has expired.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-block rounded-full bg-navey-ink px-7 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <ResetPasswordForm error={error} />
          )}
        </div>

        {!done && (
          <p className="mt-5 text-center">
            <Link href="/sign-in" className="text-xs font-bold hover:opacity-60">
              ← Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
