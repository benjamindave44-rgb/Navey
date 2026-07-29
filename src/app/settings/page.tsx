import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileInfoForm } from "@/components/ProfileInfoForm";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, handle")
    .eq("id", user.id)
    .maybeSingle();

  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;
  const error = typeof query.error === "string" ? query.error : undefined;

  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-xl">
          <Link href="/profile" className="text-sm font-semibold hover:opacity-60">
            ← Back to Profile
          </Link>
          <h1 className="mt-4 font-heading text-3xl font-extrabold">Settings</h1>

          {notice && (
            <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {notice}
            </p>
          )}
          {error && (
            <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <section className="mt-8 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
            <h2 className="font-heading text-lg font-bold">Profile</h2>
            <div className="mt-4">
              <ProfileInfoForm
                displayName={profile?.display_name ?? ""}
                handle={profile?.handle ?? ""}
              />
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
            <h2 className="font-heading text-lg font-bold">Password</h2>
            <p className="mt-1 text-sm text-navey-ink/60">
              Update the password you use to sign in.
            </p>
            <div className="mt-4">
              <ChangePasswordForm />
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
            <h2 className="font-heading text-lg font-bold">Account</h2>
            <p className="mt-1 text-sm text-navey-ink/60">
              Signed in as {user.email}
            </p>
            <DeleteAccountForm />

            <p className="mt-4 text-xs text-navey-ink/50">
              Want a copy of your data instead? Email{" "}
              <a href="mailto:navey.ph@gmail.com" className="font-semibold">
                navey.ph@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
