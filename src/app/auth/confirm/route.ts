import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// The only thing this link is used for right now is password recovery,
// so the post-exchange destination is fixed rather than passed through
// a `next` query param — Supabase's own verify/redirect hop doesn't
// reliably preserve extra query params tacked onto `redirectTo`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password`);
    }
  }

  return NextResponse.redirect(
    `${origin}/forgot-password?error=${encodeURIComponent(
      "That link is invalid or has expired. Please request a new one."
    )}`
  );
}
