"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updateListing } from "@/app/admin/actions";
import { LocationFields } from "@/components/LocationFields";
import type { AdminSpotDetail } from "@/lib/admin";

const CATEGORIES = [
  { value: "coffee_shop", label: "Coffee Shop" },
  { value: "restaurant", label: "Restaurant" },
  { value: "both", label: "Both" },
];

const PRICES = ["₱", "₱₱", "₱₱₱"];

const STATUSES = [
  { value: "approved", label: "Approved (live)" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save Changes"}
    </button>
  );
}

export function AdminListingForm({ spot }: { spot: AdminSpotDetail }) {
  const [category, setCategory] = useState(spot.category);
  const [priceRange, setPriceRange] = useState(spot.priceRange ?? "₱₱");
  const [status, setStatus] = useState(spot.status);

  return (
    <form action={updateListing} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={spot.id} />

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-semibold">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={spot.name}
          required
          className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Status</p>
        <div className="flex gap-2">
          {STATUSES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                status === option.value
                  ? "bg-navey-ink text-navey-yellow"
                  : "bg-navey-band"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="status" value={status} />
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

      <LocationFields
        initialAddress={spot.address}
        initialCity={spot.city}
        initialProvince={spot.province ?? ""}
        initialLat={spot.lat}
        initialLng={spot.lng}
      />

      <div>
        <p className="mb-2 text-sm font-semibold">Price range</p>
        <div className="flex gap-2">
          {PRICES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPriceRange(option)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                priceRange === option
                  ? "bg-navey-ink text-navey-yellow"
                  : "bg-navey-band"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <input type="hidden" name="priceRange" value={priceRange} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-semibold">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={spot.description ?? ""}
          className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
        <input type="checkbox" name="hiddenGem" defaultChecked={spot.hiddenGem} />
        Hidden Gem
      </label>

      <label className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
        <input
          type="checkbox"
          name="needsReview"
          defaultChecked={spot.needsReview}
        />
        Flagged for review
      </label>

      <p className="text-xs text-navey-ink/50">
        Hours, payment methods, amenities, and photos can only be edited by
        the listing&apos;s owner from their Owner Dashboard.
      </p>

      <SaveButton />
    </form>
  );
}
