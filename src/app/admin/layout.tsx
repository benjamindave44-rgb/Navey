import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/");

  return (
    <>
      <Header />
      <div className="border-b border-black/5 bg-white px-6 md:px-12">
        <nav className="mx-auto flex max-w-4xl gap-6 py-3 text-sm font-semibold">
          <Link href="/admin" className="hover:opacity-60">
            Overview
          </Link>
          <Link href="/admin/review-queue" className="hover:opacity-60">
            Review Queue
          </Link>
          <Link href="/admin/claims" className="hover:opacity-60">
            Claims
          </Link>
        </nav>
      </div>
      <main className="flex-1 px-6 py-10 md:px-12">{children}</main>
      <Footer />
    </>
  );
}
