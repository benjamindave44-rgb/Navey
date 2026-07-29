import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExploreMap } from "@/components/ExploreMap";
import { getMapSpots } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ExploreMapPage() {
  const spots = await getMapSpots();
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;

  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-6 py-10 md:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl font-extrabold">Explore Spots</h1>
          <div className="flex gap-1 rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
            <Link
              href="/explore"
              className="rounded-full px-4 py-1.5 text-xs font-bold text-navey-ink/60 hover:text-navey-ink"
            >
              List
            </Link>
            <span className="rounded-full bg-navey-ink px-4 py-1.5 text-xs font-bold text-navey-yellow">
              Map
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm text-navey-ink/60">
          {spots.length} spot{spots.length === 1 ? "" : "s"} on the map
        </p>

        <div className="mt-6">
          <ExploreMap spots={spots} token={token} />
        </div>
      </main>
      <Footer />
    </>
  );
}
