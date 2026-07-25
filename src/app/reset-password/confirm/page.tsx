import Image from "next/image";
import Link from "next/link";
import { confirmRecovery } from "./actions";

export const dynamic = "force-dynamic";

// This interstitial exists so the actual token-verifying request only
// fires on a real button click (a POST via Server Action), not on the
// page's own GET load. Email security scanners (Microsoft Safe Links,
// Gmail link expansion, etc.) prefetch plain GET links in emails, which
// silently burns Supabase's one-time recovery token before the user
// ever clicks it. Gating verification behind a click keeps the token
// alive until a real person acts on it.
export default async function ConfirmResetPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
  const type = typeof params.type === "string" ? params.type : "recovery";

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

        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_12px_32px_rgba(20,18,11,0.1)]">
          {tokenHash ? (
            <>
              <div className="mb-3.5 text-4xl" aria-hidden>
                🔑
              </div>
              <h1 className="font-heading text-xl font-extrabold">
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-navey-ink/65">
                Click below to continue to setting a new password.
              </p>
              <form action={confirmRecovery} className="mt-6">
                <input type="hidden" name="token_hash" value={tokenHash} />
                <input type="hidden" name="type" value={type} />
                <button
                  type="submit"
                  className="w-full rounded-full bg-navey-ink px-5 py-3.5 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
                >
                  Continue
                </button>
              </form>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
