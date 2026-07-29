import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Caps how often a single person can repeat an action.
 *
 * The counter lives in the database because the app runs across several
 * serverless instances: a number held in one process would be invisible to
 * the others and reset whenever an instance went cold.
 *
 * Fails open. If the check itself errors, the action proceeds -- a database
 * hiccup shouldn't stop honest people submitting a spot, and the downside of
 * letting a few extra requests through is much smaller than a site that
 * refuses everyone.
 */
export async function withinRateLimit(
  action: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number }
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Signed-in people are limited per account; everyone else per address,
    // so one person can't reset their allowance by signing out.
    const identity = user?.id ?? (await callerAddress());

    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: `${action}:${identity}`,
      p_limit: limit,
      p_window: `${windowSeconds} seconds`,
    });

    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}

async function callerAddress(): Promise<string> {
  const headerList = await headers();
  // The left-most entry is the original client; the rest are proxies.
  const forwarded = headerList.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
