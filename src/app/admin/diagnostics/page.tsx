import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Server-rendered pages hide their real error behind a digest in production,
 * which makes a failing query nearly impossible to diagnose from the outside.
 * This runs the spot-detail query in pieces against a live row and prints
 * whatever the database actually says, so a broken listing can be identified
 * rather than guessed at. Admin-only via the layout gate.
 */

const FULL_SELECT = `id, name, category, price_range, city, province, address, lat, lng,
   description, hidden_gem, pwd_friendly, save_count,
   noise_level, music_style, lighting, seating_style,
   accepts_cash, accepts_qr_ph, accepts_cards, accepts_bank_transfer,
   spot_tags(tags(label)),
   spot_photos(id, url, kind),
   spot_hours(day_of_week, open_time, close_time, is_closed, is_24_hours),
   reviews(id, rating, body, created_at, user_id, profiles(display_name), review_photos(url)),
   submitted_by, submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)`;

// Narrowing one piece at a time is what turns "the page is broken" into a
// named culprit: the first probe that fails is the part at fault.
const PROBES: { label: string; select: string }[] = [
  { label: "Plain columns only", select: "id, name, city" },
  { label: "+ hours (without the 24-hour column)", select: "id, spot_hours(day_of_week, open_time, close_time, is_closed)" },
  { label: "+ hours (with the 24-hour column)", select: "id, spot_hours(day_of_week, open_time, close_time, is_closed, is_24_hours)" },
  { label: "+ tags", select: "id, spot_tags(tags(label))" },
  { label: "+ photos", select: "id, spot_photos(id, url, kind)" },
  { label: "+ reviews", select: "id, reviews(id, rating, body, created_at, user_id, profiles(display_name), review_photos(url))" },
  { label: "+ contributor profile", select: "id, submitted_by, submitted_by_profile:profiles!spots_submitted_by_fkey(display_name)" },
  { label: "Everything (what the spot page runs)", select: FULL_SELECT },
];

export default async function DiagnosticsPage() {
  const { data: sample, error: sampleError } = await supabase
    .from("spots")
    .select("id, name")
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (sampleError || !sample) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="font-heading text-3xl font-extrabold">Diagnostics</h1>
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not even list a spot:{" "}
          {sampleError?.message ?? "no approved spots found"}
        </p>
      </div>
    );
  }

  const results = await Promise.all(
    PROBES.map(async (probe) => {
      const { error } = await supabase
        .from("spots")
        .select(probe.select)
        .eq("id", sample.id)
        .maybeSingle();
      return { ...probe, error };
    })
  );

  const firstFailure = results.find((result) => result.error);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-3xl font-extrabold">Diagnostics</h1>
      <p className="mt-2 text-sm text-navey-ink/60">
        Testing against <strong>{sample.name}</strong>.
      </p>

      <div
        className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
          firstFailure ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
        }`}
      >
        {firstFailure
          ? `Failing at: ${firstFailure.label}`
          : "Every part of the spot query succeeded. The fault is not in the database."}
      </div>

      <ul className="mt-6 space-y-3">
        {results.map((result) => (
          <li
            key={result.label}
            className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
          >
            <p className="font-heading text-sm font-bold">
              {result.error ? "✕" : "✓"} {result.label}
            </p>
            {result.error && (
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-navey-band p-3 text-xs">
                {JSON.stringify(result.error, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
