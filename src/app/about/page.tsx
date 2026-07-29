import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "About",
  description:
    "Navey helps people find coffee shops and restaurants worth the trip across the Philippines, described by the people who actually go there.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-4 py-10 sm:px-6 md:px-12 md:py-14">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-heading text-3xl font-extrabold md:text-4xl">
            About Navey
          </h1>

          <p className="mt-6 text-base leading-relaxed text-navey-ink/80">
            Navey is a guide to coffee shops and restaurants across the
            Philippines — the ones worth the trip, described by people who
            actually go there.
          </p>

          <h2 className="mt-10 font-heading text-xl font-bold">
            Why we built it
          </h2>
          <p className="mt-3 text-base leading-relaxed text-navey-ink/80">
            Finding a good spot usually means scrolling reviews that don&apos;t
            answer what you actually want to know. Is there WiFi that holds up?
            Can you sit and work for two hours? Is it quiet enough to talk? Does
            it take GCash? Those details rarely make it into a star rating, so
            we built the listing around them instead.
          </p>

          <h2 className="mt-10 font-heading text-xl font-bold">
            What makes a spot worth listing
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-base leading-relaxed text-navey-ink/80">
            <li>
              <strong>Honest details.</strong> Real hours, real payment methods,
              real photos of the place as it is.
            </li>
            <li>
              <strong>The vibe, stated plainly.</strong> Noise, lighting,
              seating and whether it suits work, a date, or a long catch-up.
            </li>
            <li>
              <strong>Hidden gems count.</strong> A small neighbourhood place
              deserves the same care as a mall chain.
            </li>
          </ul>

          <h2 className="mt-10 font-heading text-xl font-bold">
            Adding your place
          </h2>
          <p className="mt-3 text-base leading-relaxed text-navey-ink/80">
            Anyone can{" "}
            <Link href="/submit-a-spot" className="font-semibold underline">
              submit a spot
            </Link>
            . If you own or manage a business already listed, you can{" "}
            <Link href="/explore" className="font-semibold underline">
              find it
            </Link>{" "}
            and claim it to manage its hours, photos and details yourself.
            Submissions are reviewed before they go live.
          </p>

          <h2 className="mt-10 font-heading text-xl font-bold">Get in touch</h2>
          <p className="mt-3 text-base leading-relaxed text-navey-ink/80">
            Corrections, questions, or a spot we should know about —{" "}
            <a
              href="mailto:navey.ph@gmail.com"
              className="font-semibold underline"
            >
              navey.ph@gmail.com
            </a>
            .
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
            >
              Explore spots
            </Link>
            <Link
              href="/submit-a-spot"
              className="rounded-full bg-navey-band px-6 py-3 text-sm font-bold hover:bg-navey-band/70"
            >
              Submit a spot
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
