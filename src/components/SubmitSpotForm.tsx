"use client";

import { useState } from "react";
import { SPOT_CATEGORIES } from "@/lib/categories";
import { useFormStatus } from "react-dom";
import { submitSpot } from "@/app/submit-a-spot/actions";
import type { Tag } from "@/lib/queries";
import { PhotoPicker } from "@/components/PhotoPicker";
import { LocationFields } from "@/components/LocationFields";
import { HoursQuickPicker } from "@/components/HoursQuickPicker";
import { TagPicker } from "@/components/TagPicker";


const PRICES = ["₱", "₱₱", "₱₱₱"];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Submitting…" : label}
    </button>
  );
}

export function SubmitSpotForm({
  tags,
  knownDistricts = [],
  error,
  action = submitSpot,
  submitLabel = "Submit Spot",
  footnote = "Submitted spots are reviewed by our team before they appear publicly. This usually takes a day or two.",
  allowFeature = false,
  asGuest = false,
}: {
  tags: Tag[];
  knownDistricts?: string[];
  error?: string;
  action?: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  footnote?: string | null;
  /** Admin-only: regular submitters must not be able to feature themselves. */
  allowFeature?: boolean;
  /**
   * Nobody is signed in. Asks who they are, and hides the two sections an
   * anonymous submission cannot carry -- photos, because that is the one field
   * here that could put arbitrary content in our storage, and hours, because
   * somebody recommending a shop knows its street but rarely its seven-day
   * opening times. The short form is also the one people finish.
   */
  asGuest?: boolean;
}) {
  const [category, setCategory] = useState("coffee_shop");
  const [price, setPrice] = useState("₱₱");
  const [name, setName] = useState("");
  const [nameFromSearch, setNameFromSearch] = useState(false);

  // Filled from the address search, but never over something already typed --
  // the person's own wording wins, and the search names the mall rather than
  // the shop often enough to matter. Street results arrive with no name at
  // all, since their title is the street.
  function handleLocationPick(picked: { name: string }) {
    if (!picked.name || name.trim().length > 0) return;
    setName(picked.name);
    setNameFromSearch(true);
  }


  return (
    <form action={action} className="flex max-w-2xl flex-col gap-6">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section>
        <p className="mb-2 text-sm font-semibold">Photos</p>
        {!asGuest && <PhotoPicker name="photos" max={4} />}
        {asGuest && (
          <p className="rounded-xl bg-navey-band px-4 py-3 text-xs text-navey-ink/70">
            Photos can be added once the spot is approved — or sign in first and
            you can attach them now.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-semibold">
          Spot name
        </label>
        <input
          id="name"
          type="text"
          name="name"
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameFromSearch(false);
          }}
          placeholder="Fills in when you pick the shop below"
          className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
        />
        {nameFromSearch && (
          <p className="text-xs text-navey-ink/50">
            Filled from your search — edit it if the shop goes by another name.
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Category</p>
        {/* Wraps: there are seven kinds now, and a single row of seven
            buttons runs off the side of a phone, which is where this form
            is actually filled in. */}
        <div className="flex flex-wrap gap-2">
          {SPOT_CATEGORIES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCategory(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                category === option.value
                  ? "bg-navey-ink text-navey-yellow"
                  : "bg-navey-band"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="category" value={category} />
      </div>

      <LocationFields onPick={handleLocationPick} knownDistricts={knownDistricts} />

      {!asGuest && <HoursQuickPicker />}

      <div>
        <p className="mb-2 text-sm font-semibold">Price range</p>
        <div className="flex gap-2">
          {PRICES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPrice(option)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                price === option ? "bg-navey-ink text-navey-yellow" : "bg-navey-band"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <input type="hidden" name="priceRange" value={price} />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Vibe &amp; Amenities</p>
        <TagPicker tags={tags} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-semibold">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="rounded-2xl border border-black/10 px-4 py-3 text-base sm:text-sm outline-none focus:border-navey-ink"
        />
      </div>

      {allowFeature && (
        <label className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
          <input type="checkbox" name="featured" />
          Feature on homepage
          <span className="font-normal text-navey-ink/50">
            — adds it to &quot;Our picks this week&quot;
          </span>
        </label>
      )}

      {footnote && (
        <p className="text-xs text-navey-ink/50">{footnote}</p>
      )}

      {asGuest && (
        <div className="flex flex-col gap-3 rounded-2xl bg-navey-band/50 p-4">
          <div>
            <p className="font-heading font-bold">Who should we credit?</p>
            <p className="mt-0.5 text-xs text-navey-ink/60">
              Your name is never shown on the listing. Make an account later
              with this same email and every spot you have sent in becomes
              yours.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Your name
            <input
              name="submitterName"
              type="text"
              required
              maxLength={80}
              className="rounded-full border border-black/10 px-4 py-3 text-base font-normal outline-none focus:border-navey-ink sm:text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Your email
            <input
              name="submitterEmail"
              type="email"
              required
              maxLength={160}
              className="rounded-full border border-black/10 px-4 py-3 text-base font-normal outline-none focus:border-navey-ink sm:text-sm"
            />
          </label>
        </div>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
