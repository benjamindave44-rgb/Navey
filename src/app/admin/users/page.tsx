import { getAdminUsers } from "@/lib/admin";
import { setUserRole } from "@/app/admin/users/actions";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;
  const error = typeof query.error === "string" ? query.error : undefined;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const users = await getAdminUsers();
  const adminCount = users.filter((entry) => entry.role === "admin").length;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-3xl font-extrabold">Users</h1>
      <p className="mt-2 text-sm text-navey-ink/60">
        {users.length} account{users.length === 1 ? "" : "s"} · {adminCount} admin
        {adminCount === 1 ? "" : "s"}
      </p>

      {notice && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {users.map((entry) => {
          const isSelf = entry.id === user?.id;
          return (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(20,18,11,0.05)]"
            >
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold">
                  {entry.displayName ?? "No name"}
                  {isSelf && (
                    <span className="ml-2 text-xs font-semibold text-navey-ink/45">
                      you
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-navey-ink/55">{entry.email}</p>
                <p className="mt-1 text-xs text-navey-ink/45">
                  {entry.provider ?? "email"} · {entry.spotCount} spot
                  {entry.spotCount === 1 ? "" : "s"} · {entry.reviewCount} review
                  {entry.reviewCount === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {entry.role === "admin" && (
                  <span className="rounded-full bg-navey-ink px-3 py-1 text-xs font-bold text-navey-yellow">
                    Admin
                  </span>
                )}
                <form action={setUserRole}>
                  <input type="hidden" name="id" value={entry.id} />
                  <input
                    type="hidden"
                    name="role"
                    value={entry.role === "admin" ? "user" : "admin"}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-navey-band px-4 py-2 text-xs font-bold hover:bg-navey-band/70"
                  >
                    {entry.role === "admin" ? "Remove admin" : "Make admin"}
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-navey-ink/50">
        Admins can approve listings, edit any spot, moderate reviews and manage
        collections. Only give it to people you trust with all of that.
      </p>
    </div>
  );
}
