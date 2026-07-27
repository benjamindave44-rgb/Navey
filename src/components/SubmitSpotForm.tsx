"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitSpot } from "@/app/submit-a-spot/actions";
import { PhotoPicker } from "@/components/PhotoPicker";
import { LocationPicker } from "@/components/LocationPicker";

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
}: {
  tags: { id: number; label: string; icon: string | null }[];
  error?: string;
  action?: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  footnote?: string | null;
}) {
  const [category, setCategory] = useState("coffee_shop");
  const [price, setPrice] = useState("₱₱");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

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
          className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
        />
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

      <div className="flex flex-col gap-2">
        <label htmlFor="address" className="text-sm font-semibold">
          Address
        </label>
        <input
          id="address"
          type="text"
          name="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          required
          className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="city" className="text-sm font-semibold">
            City
          </label>
          <input
            id="city"
            type="text"
            name="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            required
            className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="province" className="text-sm font-semibold">
            Province (optional)
          </label>
          <input
            id="province"
            type="text"
            name="province"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
          />
        </div>
      </div>

      <LocationPicker
        lat={null}
        lng={null}
        searchHint={[address, city, province].filter(Boolean).join(", ")}
      />

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

      {footnote && (
        <p className="text-xs text-navey-ink/50">{footnote}</p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
