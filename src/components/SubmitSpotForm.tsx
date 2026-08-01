"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitSpot } from "@/app/submit-a-spot/actions";
import { PhotoPicker } from "@/components/PhotoPicker";
import { LocationFields } from "@/components/LocationFields";
import { HoursQuickPicker } from "@/components/HoursQuickPicker";

const CATEGORIES = [
  { value: "coffee_shop", label: "Coffee Shop" },
  { value: "restaurant", label: "Restaurant" },
  { value: "both", label: "Both" },
];

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
  error,
  action = submitSpot,
  submitLabel = "Submit Spot",
  footnote = "Submitted spots are reviewed by our team before they appear publicly. This usually takes a day or two.",
  allowFeature = false,
}: {
  tags: { id: number; label: string; icon: string | null }[];
  error?: string;
  action?: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  footnote?: string | null;
  /** Admin-only: regular submitters must not be able to feature themselves. */
  allowFeature?: boolean;
}) {
  const [category, setCategory] = useState("coffee_shop");
  const [price, setPrice] = useState("₱₱");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
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

  function toggleTag(id: number) {
    setSelectedTags((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    );
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
        <PhotoPicker name="photos" max={4} />
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
        <div className="flex gap-2">
          {CATEGORIES.map((option) => (
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

      <LocationFields onPick={handleLocationPick} />

      <HoursQuickPicker />

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
        <p className="mb-2 text-sm font-semibold">Vibe & Amenities</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                selectedTags.includes(tag.id)
                  ? "bg-navey-ink text-navey-yellow"
                  : "bg-navey-band"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
        {selectedTags.map((id) => (
          <input key={id} type="hidden" name="tagIds" value={id} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-semibold">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
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

      <SubmitButton label={submitLabel} />
    </form>
  );
}
