import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileTabs } from "@/components/ProfileTabs";
import { getProfileData } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const profile = await getProfileData(user.id);
  if (!profile) redirect("/sign-in");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  const initial = profile.displayName.trim()[0]?.toUpperCase() ?? "?";
  const joined = new Date(profile.joinedAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const stats: { label: string; value: number }[] = [
    { label: "Spots Saved", value: profile.stats.spotsSaved },
    { label: "Reviews", value: profile.stats.reviewsCount },
    { label: "Hidden Gems Found", value: profile.stats.hiddenGemsFound },
    { label: "Lists Created", value: profile.stats.listsCreated },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-5xl">
          {error && (
            <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
            <div className="flex items-center gap-4">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navey-ink text-2xl font-bold text-navey-yellow">
                {initial}
              </span>
              <div>
                <h1 className="font-heading text-2xl font-extrabold">
                  {profile.displayName}
                </h1>
                {profile.handle && (
                  <p className="text-sm text-navey-ink/60">@{profile.handle}</p>
                )}
                <p className="text-sm text-navey-ink/60">Joined {joined}</p>
              </div>
            </div>
            <Link
              href="/settings"
              className="rounded-full bg-navey-band px-5 py-2 text-sm font-bold hover:bg-navey-band/70"
            >
              Edit Profile
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white p-4 text-center shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
              >
                <p className="font-heading text-2xl font-extrabold">
                  {stat.value}
                </p>
                <p className="text-xs uppercase tracking-wide text-navey-ink/50">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <ProfileTabs profile={profile} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
