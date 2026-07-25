import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center px-6 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/navey-icon.png"
            alt="Navey"
            width={44}
            height={44}
            className="h-10 w-10"
          />
          <span className="font-heading text-2xl font-extrabold tracking-tight">
            NAVEY
          </span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 text-5xl" aria-hidden>
          🧭
        </div>
        <h1 className="font-heading text-3xl font-extrabold">
          This page wandered off
        </h1>
        <p className="mt-3 max-w-sm text-sm text-navey-ink/65">
          The link you followed may be broken, or the page has been moved.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-navey-ink px-7 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80"
          >
            Back to Navey
          </Link>
          <Link
            href="/explore"
            className="rounded-full border border-black/10 bg-white px-7 py-3 text-sm font-bold hover:bg-navey-band"
          >
            Explore spots
          </Link>
        </div>
      </main>
    </div>
  );
}
