export function Footer() {
  return (
    <footer className="mt-auto bg-navey-footer px-6 py-10 md:px-12">
      <div className="flex flex-col gap-2">
        <span className="font-heading text-2xl font-extrabold">NAVEY</span>
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
