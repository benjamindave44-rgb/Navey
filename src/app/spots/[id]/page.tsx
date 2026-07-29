import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotCard } from "@/components/SpotCard";
import { PhotoSlider } from "@/components/PhotoSlider";
import { SaveHeartButton } from "@/components/SaveHeartButton";
import { ShareSpotButton } from "@/components/ShareSpotButton";
import { ReportReviewButton } from "@/components/ReportReviewButton";
import { SaveSpotButton } from "@/components/SaveSpotButton";
import {
  getRelatedSpots,
  getSpotDetail,
  type SpotDetail,
} from "@/lib/queries";
import { getSavedSpotIds } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const spot = await getSpotDetail(id);
  if (!spot) return { title: "Spot not found" };

  const description =
    spot.description ??
    `${spot.name} in ${spot.city} — ${
      CATEGORY_LABEL[spot.category] ?? spot.category
    }${spot.price_range ? `, ${spot.price_range}` : ""}. Find hours, reviews, and photos on Navey.`;
  const photo = spot.galleryPhotos[0]?.url;

  return {
    title: `${spot.name} in ${spot.city}`,
    description,
    alternates: { canonical: `/spots/${spot.id}` },
    openGraph: {
      title: spot.name,
      description,
      type: "website",
      images: photo ? [{ url: photo }] : undefined,
    },
    twitter: {
      card: photo ? "summary_large_image" : "summary",
      title: spot.name,
      description,
      images: photo ? [photo] : undefined,
    },
  };
}

const CATEGORY_LABEL: Record<string, string> = {
  coffee_shop: "Coffee Shop",
  restaurant: "Restaurant",
  both: "Coffee Shop & Restaurant",
};

// schema.org expects its own day URIs, not the display labels below.
const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const PAYMENT_OPTIONS: {
  key: keyof Pick<
    SpotDetail,
    "accepts_cash" | "accepts_qr_ph" | "accepts_cards" | "accepts_bank_transfer"
  >;
  label: string;
}[] = [
  { key: "accepts_cash", label: "Cash" },
  { key: "accepts_qr_ph", label: "QR Ph" },
  { key: "accepts_cards", label: "Cards" },
  { key: "accepts_bank_transfer", label: "Bank Transfer" },
];

export default async function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spot = await getSpotDetail(id);

  if (!spot) notFound();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = Boolean(user && spot.contributor?.id === user.id);

  const [related, savedSpotIds] = await Promise.all([
    getRelatedSpots(spot.id, spot.city, 4),
    getSavedSpotIds(),
  ]);
  const acceptedPayments = PAYMENT_OPTIONS.filter(({ key }) => spot[key]);
  const isPdf = (url: string) => url.toLowerCase().endsWith(".pdf");
  const menuImages = spot.menuPhotos.filter((photo) => !isPdf(photo.url));
  const menuPdfs = spot.menuPhotos.filter((photo) => isPdf(photo.url));
  const today = new Date().getDay();

  const schemaType =
    spot.category === "restaurant"
      ? "Restaurant"
      : spot.category === "coffee_shop"
      ? "CafeOrCoffeeShop"
      : "FoodEstablishment";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: spot.name,
    ...(spot.description ? { description: spot.description } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: spot.address,
      addressLocality: spot.city,
      ...(spot.province ? { addressRegion: spot.province } : {}),
      addressCountry: "PH",
    },
    ...(spot.lat != null && spot.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: spot.lat, longitude: spot.lng } }
      : {}),
    ...(spot.galleryPhotos.length > 0
      ? { image: spot.galleryPhotos.map((photo) => photo.url) }
      : {}),
    ...(spot.price_range ? { priceRange: spot.price_range } : {}),
    // Hours are already on the page; declaring them is what lets Google show
    // "Open now" or "Closes 9 PM" beside the result.
    ...(spot.hours.some((hour) => !hour.is_closed && hour.open_time)
      ? {
          openingHoursSpecification: spot.hours
            .filter((hour) => !hour.is_closed && hour.open_time && hour.close_time)
            .map((hour) => ({
              "@type": "OpeningHoursSpecification",
              dayOfWeek: `https://schema.org/${SCHEMA_DAYS[hour.day_of_week]}`,
              opens: hour.open_time,
              closes: hour.close_time,
            })),
        }
      : {}),
    url: `https://www.navey.co/spots/${spot.id}`,
    ...(spot.averageRating != null && spot.reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: spot.averageRating.toFixed(1),
            reviewCount: spot.reviews.length,
          },
        }
      : {}),
  };
  // Produces the Home › City › Spot trail in search results, in place of a
  // bare URL. It has to mirror the on-page breadcrumb exactly.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.navey.co",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: spot.city,
        item: `https://www.navey.co/explore?city=${encodeURIComponent(spot.city)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: spot.name,
        item: `https://www.navey.co/spots/${spot.id}`,
      },
    ],
  };

  // Route by business name rather than by our stored pin. Our coordinates
  // come from someone tapping a small map, so they land near the building at
  // best; Google's own record of the shop is the more accurate destination,
  // and a pin that is merely close sends people to the wrong door. The pin
  // stays authoritative for the Explore Map, where approximate is fine.
  const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${spot.name}, ${spot.address}, ${spot.city}`
  )}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-6 md:px-12">
          <nav className="flex items-center gap-2 text-xs font-semibold text-navey-ink/50">
            <Link href="/" className="hover:opacity-60">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link
              href={`/explore?city=${encodeURIComponent(spot.city)}`}
              className="hover:opacity-60"
            >
              {spot.city}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-navey-ink">{spot.name}</span>
          </nav>

          <div className="mt-4">
            <PhotoSlider
              photos={spot.galleryPhotos}
              name={spot.name}
              aspect="aspect-[4/3] md:aspect-[16/9]"
              priority
            />
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              {spot.hidden_gem && (
                <span className="mb-3 inline-block rounded-full bg-navey-ink px-3 py-1 text-xs font-bold text-navey-yellow">
                  Hidden Gem
                </span>
              )}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h1 className="font-heading text-3xl font-extrabold md:text-4xl">
                  {spot.name}
                </h1>
                <div className="flex items-center gap-2">
                  <SaveHeartButton
                    spotId={spot.id}
                    initialSaved={savedSpotIds.has(spot.id)}
                    variant="plain"
                  />
                  <ShareSpotButton name={spot.name} city={spot.city} />
                </div>
              </div>
              <p className="mt-1 text-sm text-navey-ink/70">
                {CATEGORY_LABEL[spot.category] ?? spot.category}
                {spot.price_range ? ` · ${spot.price_range}` : ""} · {spot.city}
              </p>
              <p className="mt-1 text-xs text-navey-ink/50">
                {spot.saveCount} save{spot.saveCount === 1 ? "" : "s"}
              </p>

              {(spot.tags.length > 0 || spot.pwd_friendly) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {spot.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
                    >
                      {tag}
                    </span>
                  ))}
                  {spot.pwd_friendly && (
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
                      PWD Friendly
                    </span>
                  )}
                </div>
              )}

              {spot.description && (
                <p className="mt-6 text-base text-navey-ink/80">
                  {spot.description}
                </p>
              )}

              <section className="mt-8">
                <h2 className="font-heading text-lg font-bold">
                  Vibe & Ambiance
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <VibeCard label="Noise Level" value={spot.noise_level} />
                  <VibeCard label="Music" value={spot.music_style} />
                  <VibeCard label="Lighting" value={spot.lighting} />
                  <VibeCard label="Seating" value={spot.seating_style} />
                </div>
              </section>

              <section className="mt-8">
                <h2 className="font-heading text-lg font-bold">Menu</h2>
                {spot.menuPhotos.length === 0 ? (
                  <p className="mt-3 text-sm text-navey-ink/60">
                    No menu uploaded yet.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-3">
                    {menuImages.length > 0 && (
                      /* One at a time: a menu is text, unreadable as a
                         thumbnail in a three-column grid on a phone. */
                      <PhotoSlider
                        photos={menuImages}
                        name={`${spot.name} menu`}
                        aspect="aspect-[3/4] sm:aspect-[4/3]"
                        emptyIcon="📋"
                      />
                    )}
                    {/* A PDF can't be rendered inline, so hand it to the
                        device's own viewer, where it stays zoomable. */}
                    {menuPdfs.map((pdf, position) => (
                      <a
                        key={pdf.id}
                        href={pdf.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)] transition-transform hover:-translate-y-0.5"
                      >
                        <span aria-hidden className="text-2xl">
                          📄
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-bold">
                            {menuPdfs.length > 1
                              ? `Menu ${position + 1} (PDF)`
                              : "View full menu (PDF)"}
                          </span>
                          <span className="block text-xs text-navey-ink/55">
                            Opens in a new tab
                          </span>
                        </span>
                        <span aria-hidden className="text-lg">
                          ↗
                        </span>
                      </a>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-navey-ink/50">
                  Updated by owner · uploadable anytime
                </p>
              </section>

              <section className="mt-10">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-heading text-lg font-bold">
                    Recent Visits
                  </h2>
                  <Link
                    href={`/spots/${spot.id}/review`}
                    className="rounded-full bg-navey-ink px-4 py-2 text-xs font-bold text-navey-yellow hover:bg-navey-ink/80"
                  >
                    Write a Review
                  </Link>
                </div>
                {spot.reviews.length === 0 ? (
                  <p className="mt-3 text-sm text-navey-ink/60">
                    No reviews yet — be the first to share your visit.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {spot.reviews.map((review) => (
                      <li
                        key={review.id}
                        className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
                      >
                        <div className="flex items-center justify-between">
                          {review.authorId ? (
                            <Link
                              href={`/u/${review.authorId}`}
                              className="font-semibold hover:underline"
                            >
                              {review.author}
                            </Link>
                          ) : (
                            <span className="font-semibold">
                              {review.author}
                            </span>
                          )}
                          <span aria-label={`${review.rating} out of 5 stars`}>
                            <span className="text-amber-400">
                              {"★".repeat(review.rating)}
                            </span>
                            <span className="text-navey-ink/20">
                              {"★".repeat(5 - review.rating)}
                            </span>
                          </span>
                        </div>
                        {review.body && (
                          <p className="mt-2 text-sm text-navey-ink/80">
                            {review.body}
                          </p>
                        )}
                        {review.photos.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            {review.photos.map((url) => (
                              <div
                                key={url}
                                className="relative h-16 w-16 overflow-hidden rounded-lg bg-navey-band"
                              >
                                <Image
                                  src={url}
                                  alt="From a visitor's review"
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <ReportReviewButton reviewId={review.id} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
                <div className="flex aspect-[4/3] items-center justify-center bg-navey-band text-4xl">
                  🗺️
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <p className="text-sm text-navey-ink/70">
                    {spot.address}, {spot.city}
                    {spot.province ? `, ${spot.province}` : ""}
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-full bg-navey-ink px-4 py-2 text-center text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
                    >
                      Get Directions
                    </a>
                    <SaveSpotButton
                      spotId={spot.id}
                      initialSaved={savedSpotIds.has(spot.id)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
                <p className="font-heading font-bold">Payment Methods</p>
                {acceptedPayments.length === 0 ? (
                  <p className="mt-3 text-sm text-navey-ink/60">
                    No payment info yet.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {acceptedPayments.map(({ key, label }) => (
                      <span
                        key={key}
                        className="rounded-full bg-navey-band px-3 py-1 font-semibold"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {spot.hours.length > 0 && (
                <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
                  <p className="font-heading font-bold">Hours</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {spot.hours.map((hour) => (
                      <li
                        key={hour.day_of_week}
                        className={`flex justify-between border-b border-black/5 py-1 ${
                          hour.day_of_week === today ? "font-bold" : ""
                        }`}
                      >
                        <span>{DAY_LABELS[hour.day_of_week]}</span>
                        <span>
                          {hour.is_closed
                            ? "Closed"
                            : `${hour.open_time ?? "?"} – ${hour.close_time ?? "?"}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {spot.contributor && (
                <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
                  <p className="font-heading font-bold">Contributed by</p>
                  <Link
                    href={`/u/${spot.contributor.id}`}
                    className="mt-2 block text-sm text-navey-ink/70 hover:text-navey-ink hover:underline"
                  >
                    {spot.contributor.name}
                  </Link>
                </div>
              )}

              {!isOwner && (
                <div className="rounded-2xl bg-navey-band p-4">
                  <p className="font-heading font-bold">Own this business?</p>
                  <p className="mt-1 text-sm text-navey-ink/70">
                    Claim this listing to manage its menu, hours, and photos.
                  </p>
                  <Link
                    href={`/spots/${spot.id}/claim`}
                    className="mt-3 inline-block rounded-full bg-navey-ink px-4 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
                  >
                    Claim this business
                  </Link>
                </div>
              )}
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-16 border-t border-black/5 pt-10">
              <h2 className="mb-6 font-heading text-2xl font-extrabold">
                More spots nearby
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((relatedSpot) => (
                  <SpotCard key={relatedSpot.id} spot={relatedSpot} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function VibeCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
      <p className="text-xs uppercase tracking-wide text-navey-ink/50">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value ?? "Not set"}</p>
    </div>
  );
}
