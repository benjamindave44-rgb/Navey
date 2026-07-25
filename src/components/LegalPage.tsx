import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({
  title,
  lastUpdated,
  sections,
  crossLinkHref,
  crossLinkLabel,
}: {
  title: string;
  lastUpdated: string;
  sections: { heading: string; body: ReactNode }[];
  crossLinkHref: string;
  crossLinkLabel: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-3xl font-extrabold">{title}</h1>
      <p className="mt-1 text-xs text-navey-ink/50">Last updated: {lastUpdated}</p>

      <div className="mt-8 flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="font-heading text-lg font-bold">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-navey-ink/75">
              {section.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-black/10 pt-6">
        <Link href={crossLinkHref} className="text-sm font-bold hover:opacity-60">
          {crossLinkLabel}
        </Link>
      </div>
    </div>
  );
}
