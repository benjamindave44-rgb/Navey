import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotCard } from "@/components/SpotCard";
import { getVibeMatches } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OnboardingResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tagsParam = typeof params.tags === "string" ? params.tags : "";
  const tags = tagsParam
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const vibe = typeof params.vibe === "string" ? params.vibe : "The Explorer";

  const spots = await getVibeMatches(tags, 3);
  const exploreHref =
    tags.length > 0 ? `/explore?tags=${encodeURIComponent(tags.join(","))}` : "/explore";

  return (
    <>
      <Header />
      <main className="flex-1 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🧭
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            Your vibe: {vibe}
          </h1>
          <p className="mt-2 text-sm text-navey-ink/65">
            {spots.length > 0
              ? `We've matched ${spots.length} spot${spots.length === 1 ? "" : "s"} to your picks — here's where to start.`
              : "No approved spots yet — check back soon as more get added."}
          </p>

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-navey-ink px-4 py-1.5 text-xs font-bold text-navey-yellow"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {spots.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        )}

        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
          <Link
            href="/onboarding"
            className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-bold hover:bg-navey-band"
          >
            Retake quiz
          </Link>
          <Link
            href={exploreHref}
            className="rounded-full bg-navey-ink px-7 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
          >
            See all matches
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
