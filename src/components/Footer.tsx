import Image from "next/image";
import Link from "next/link";

const LINK_COLUMNS: { title: string; links: { label: string; href?: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "All spots", href: "/explore" },
      { label: "Hidden gems", href: "/explore?tags=Hidden%20Gems" },
      { label: "Map", href: "/explore/map" },
    ],
  },
  {
    title: "Collections",
    links: [{ label: "Curated guides" }, { label: "Community picks" }],
  },
  {
    title: "About",
    links: [
      { label: "Our story" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Submit a spot", href: "/submit-a-spot" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
];

const SOCIALS = ["IG", "FB", "TT", "YT"];

export function Footer() {
  return (
    <footer className="mt-auto bg-navey-footer px-6 py-10 md:px-12">
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[1.3fr_repeat(4,1fr)] md:gap-10">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <div className="flex items-center gap-3">
            <Image
              src="/navey-icon.png"
              alt="Navey"
              width={64}
              height={64}
              className="h-14 w-14 md:h-16 md:w-16"
            />
            <span className="font-heading text-3xl font-extrabold md:text-4xl">
              NAVEY
            </span>
          </div>
          <p className="text-sm font-medium text-navey-ink/70">
            Navigate Good Spots Nearby
          </p>
          <div className="mt-2 flex gap-2">
            {SOCIALS.map((social) => (
              <span
                key={social}
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-xs font-bold text-navey-ink/50"
              >
                {social}
              </span>
            ))}
          </div>
        </div>
        {LINK_COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <p className="text-sm font-heading font-bold">{column.title}</p>
            <ul className="flex flex-col gap-2 text-sm text-navey-ink/70">
              {column.links.map((link) =>
                link.href ? (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:opacity-60">
                      {link.label}
                    </Link>
                  </li>
                ) : (
                  <li key={link.label} className="text-navey-ink/40">
                    {link.label}
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 border-t border-black/10 pt-4 text-xs text-navey-ink/60">
        © {new Date().getFullYear()} Navey. All rights reserved.
      </div>
    </footer>
  );
}
