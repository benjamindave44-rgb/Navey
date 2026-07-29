"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function setUserRole(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "admin") redirect("/");

  const targetId = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!targetId || !["admin", "user"].includes(role)) {
    redirect("/admin/users");
  }

  // Demoting the last admin would lock everyone out of the admin area with
  // no way back in short of direct database access.
  if (role === "user") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      redirect(
        `/admin/users?error=${encodeURIComponent(
          "That's the only admin left. Promote someone else first."
        )}`
      );
    }
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", targetId)
    .select("id");

  if (error || !updated || updated.length === 0) {
    redirect(
      `/admin/users?error=${encodeURIComponent(
        error?.message ?? "Role change didn't go through."
      )}`
    );
  }

  redirect(
    `/admin/users?notice=${encodeURIComponent(
      role === "admin" ? "Promoted to admin." : "Admin access removed."
    )}`
  );
}
