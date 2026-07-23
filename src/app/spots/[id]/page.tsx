import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSpotDetail, type SpotDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  coffee_shop: "Coffee Shop",
  restaurant: "Restaurant",
  both: "Coffee Shop & Restaurant",
};

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

  const acceptedPayments = PAYMENT_OPTIONS.filter(({ key }) => spot[key]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="flex aspect-[16/6] items-center justify-center bg-navey-band text-6xl">
          ☕
        </div>

        <div className="mx-auto max-w-4xl px-6 py-10 md:px-0">
          <Link
            href="/explore"
            className="text-sm font-semibold hover:opacity-60"
          >
            ← Back to Explore
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-extrabold">
                {spot.name}
              </h1>
              <p className="mt-1 text-sm text-navey-ink/70">
                {spot.address}, {spot.city}
                {spot.province ? `, ${spot.province}` : ""}
              </p>
            </div>
            {spot.hidden_gem && (
              <span className="rounded-full bg-navey-ink px-3 py-1 text-xs font-bold text-navey-yellow">
                Hidden Gem
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-navey-band px-3 py-1 font-semibold uppercase tracking-wide">
              {CATEGORY_LABEL[spot.category] ?? spot.category}
            </span>
            {spot.price_range && <span>{spot.price_range}</span>}
            {spot.averageRating !== null && (
              <span>
                ★ {spot.averageRating.toFixed(1)} ({spot.reviews.length}{" "}
                review{spot.reviews.length === 1 ? "" : "s"})
              </span>
            )}
          </div>

          {spot.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {spot.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {spot.description && (
            <p className="mt-6 text-base text-navey-ink/80">
              {spot.description}
            </p>
          )}

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <section>
              <h2 className="font-heading text-lg font-bold">Vibe</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {spot.noise_level && (
                  <Detail label="Noise level" value={spot.noise_level} />
                )}
                {spot.music_style && (
                  <Detail label="Music" value={spot.music_style} />
                )}
                {spot.lighting && (
                  <Detail label="Lighting" value={spot.lighting} />
                )}
                {spot.seating_style && (
                  <Detail label="Seating" value={spot.seating_style} />
                )}
                {spot.pwd_friendly && (
                  <Detail label="Accessibility" value="PWD friendly" />
                )}
              </dl>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold">Payments</h2>
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
            </section>
          </div>

          {spot.hours.length > 0 && (
            <section className="mt-8">
              <h2 className="font-heading text-lg font-bold">Hours</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {spot.hours.map((hour) => (
                  <li
                    key={hour.day_of_week}
                    className="flex justify-between border-b border-black/5 py-1"
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
            </section>
          )}

          {spot.photos.length > 0 && (
            <section className="mt-8">
              <h2 className="font-heading text-lg font-bold">Photos</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {spot.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square overflow-hidden rounded-xl bg-navey-band"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={spot.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="font-heading text-lg font-bold">Reviews</h2>
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
                      <span className="font-semibold">{review.author}</span>
                      <span aria-label={`${review.rating} out of 5 stars`}>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                    </div>
                    {review.body && (
                      <p className="mt-2 text-sm text-navey-ink/80">
                        {review.body}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-navey-ink/60">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
