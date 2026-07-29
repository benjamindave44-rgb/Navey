import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignInForm } from "@/components/SignInForm";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function SignInPage({
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
  const mode = params.mode === "signup" ? "signup" : "signin";
  const error = typeof params.error === "string" ? params.error : undefined;
  const notice = typeof params.notice === "string" ? params.notice : undefined;

  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-12 md:px-16 md:py-20">
            <Link href="/" className="mb-10 inline-flex items-center gap-2">
              <Image
                src="/navey-icon.png"
                alt="Navey"
                width={44}
                height={44}
                className="h-11 w-11"
              />
              <span className="font-heading text-2xl font-extrabold">
                NAVEY
              </span>
            </Link>
            <SignInForm initialMode={mode} error={error} notice={notice} />
          </div>
          <div className="relative hidden flex-col items-center justify-center gap-4 bg-navey-band px-12 py-20 text-center md:flex">
            <span className="text-7xl" aria-hidden>
              🗺️
            </span>
            <p className="font-heading text-2xl font-extrabold">
              Navigate good spots, together
            </p>
            <p className="max-w-xs text-sm text-navey-ink/70">
              Save your favorites, write reviews, and help other explorers
              find the good stuff.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
