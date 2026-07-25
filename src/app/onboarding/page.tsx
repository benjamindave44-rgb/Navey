import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { VibeQuiz } from "@/components/VibeQuiz";

export const metadata: Metadata = {
  title: "Find Your Vibe",
  description:
    "Answer three quick questions and we'll match you with coffee shops and restaurants that fit your mood.",
  alternates: { canonical: "/onboarding" },
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-navey-yellow">
      <header className="flex w-full items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/navey-icon.png"
            alt="Navey"
            width={44}
            height={44}
            priority
            className="h-10 w-10"
          />
          <span className="font-heading text-2xl font-extrabold tracking-tight">
            NAVEY
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm font-bold text-navey-ink/55 hover:text-navey-ink"
        >
          Skip for now
        </Link>
      </header>

      <VibeQuiz />
    </div>
  );
}
