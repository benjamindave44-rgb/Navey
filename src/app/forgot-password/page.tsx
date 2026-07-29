import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { createServerSupabaseClient } from "@/lib/supabase-server";

import type { Metadata } from "next";

// Account and form pages carry no search value, and some expose a person's
// own data. robots.txt only asks crawlers to skip a path; this is what keeps
// the page out of results if it is ever linked from elsewhere.
export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  const params = await searchParams;
  const sent = typeof params.sent === "string" ? params.sent : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

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
          <ForgotPasswordForm sent={sent} error={error} />
        </div>

        <p className="mt-5 text-center">
          <Link
            href="/sign-in"
            className="text-xs font-bold hover:opacity-60"
          >
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
