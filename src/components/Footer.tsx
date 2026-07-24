import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto bg-navey-footer px-6 py-10 md:px-12">
      <div className="flex flex-col gap-3">
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
      </div>
      <div className="mt-6 border-t border-black/10 pt-4 text-xs text-navey-ink/60">
        © {new Date().getFullYear()} Navey. All rights reserved.
      </div>
    </footer>
  );
}
