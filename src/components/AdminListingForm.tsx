"use client";

import { useState } from "react";
import { SPOT_CATEGORIES } from "@/lib/categories";
import { useFormStatus } from "react-dom";
import { updateListing } from "@/app/admin/actions";
import { LocationFields } from "@/components/LocationFields";
import { OwnerHoursEditor } from "@/components/OwnerHoursEditor";
import type { AdminSpotDetail } from "@/lib/admin";
import {
  ChoiceChips,
  YesNoChips,
  yesNoValue,
} from "@/components/ChoiceChips";
import {
  LAPTOP_OPTIONS,
  OUTLET_OPTIONS,
  PARKING_OPTIONS,
  WIFI_OPTIONS,
} from "@/lib/amenities";
import { PRICE_ANCHOR_SLOTS } from "@/lib/amenity-form";


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

export function AdminListingForm({
  spot,
  knownDistricts = [],
}: {
  spot: AdminSpotDetail;
  knownDistricts?: string[];
}) {
  const [category, setCategory] = useState(spot.category);
  const [priceRange, setPriceRange] = useState(spot.priceRange ?? "₱₱");
  const [status, setStatus] = useState(spot.status);
  const [featured, setFeatured] = useState(spot.featured);

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
          className="rounded-full border border-black/10 px-4 py-3 text-base sm:text-sm outline-none focus:border-navey-ink"
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

      <LocationFields
        initialAddress={spot.address}
        initialCity={spot.city}
        initialProvince={spot.province ?? ""}
        initialDistrict={spot.district ?? ""}
        knownDistricts={knownDistricts}
        initialLat={spot.lat}
        initialLng={spot.lng}
      />

      <div>
        <p className="mb-2 text-sm font-semibold">Opening hours</p>
        <OwnerHoursEditor hours={spot.hours} />
      </div>

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
          className="rounded-2xl border border-black/10 px-4 py-3 text-base sm:text-sm outline-none focus:border-navey-ink"
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
        <input type="checkbox" name="hiddenGem" defaultChecked={spot.hiddenGem} />
        Hidden Gem
      </label>

      <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            name="featured"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
          />
          Feature on homepage
        </label>
        <p className="mt-1 text-xs text-navey-ink/50">
          Featured spots rotate through &quot;Our picks this week&quot; on the
          homepage. Add a gallery photo so it looks its best.
        </p>
        {featured && (
          <div className="mt-3 flex items-center gap-3">
            <label htmlFor="featuredRank" className="text-sm font-semibold">
              Order
            </label>
            <input
              id="featuredRank"
              name="featuredRank"
              type="number"
              min={0}
              defaultValue={spot.featuredRank}
              className="w-24 rounded-full border border-black/10 px-4 py-2 text-base sm:text-sm outline-none focus:border-navey-ink"
            />
            <span className="text-xs text-navey-ink/50">
              Lower shows first.
            </span>
          </div>
        )}
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
        <input
          type="checkbox"
          name="needsReview"
          defaultChecked={spot.needsReview}
        />
        Flagged for review
      </label>

      {/* The practical facts, as taps.
          Written as chips rather than dropdowns for a measured reason: of
          around fifty listings, thirty-eight had no seating style and eighteen
          no noise level, months after those fields were added. Adding six more
          fields behind three-minute forms would just have produced six more
          empty columns. */}
      <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
        <p className="font-heading font-bold">Can you work here?</p>
        <p className="mt-1 text-xs text-navey-ink/50">
          Tap once. Tap again to clear. Blank means nobody has checked, and the
          listing shows nothing rather than guessing.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <ChoiceChips
            name="wifi"
            label="Wifi"
            initialValue={spot.wifi ?? ""}
            options={WIFI_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <ChoiceChips
            name="powerOutlets"
            label="Power outlets"
            initialValue={spot.powerOutlets ?? ""}
            options={OUTLET_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
          <ChoiceChips
            name="laptopFriendly"
            label="Laptops"
            initialValue={spot.laptopFriendly ?? ""}
            options={LAPTOP_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
        <p className="font-heading font-bold">Comfort &amp; parking</p>
        <div className="mt-4 flex flex-col gap-4">
          <YesNoChips
            name="hasAircon"
            label="Aircon"
            initialValue={yesNoValue(spot.hasAircon)}
          />
          <YesNoChips
            name="hasOutdoorSeating"
            label="Outdoor seating"
            initialValue={yesNoValue(spot.hasOutdoorSeating)}
          />
          <ChoiceChips
            name="parking"
            label="Parking"
            initialValue={spot.parking ?? ""}
            options={PARKING_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
        <p className="font-heading font-bold">How to reach it</p>
        <p className="mt-1 text-xs text-navey-ink/50">
          The Instagram handle is the most useful field on this form. Paste the
          handle or the whole profile link — either works.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Instagram
            <input
              name="instagram"
              type="text"
              defaultValue={spot.instagram ?? ""}
              placeholder="navey.co"
              className="rounded-full border border-black/10 px-4 py-2.5 text-base font-normal outline-none focus:border-navey-ink sm:text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Phone
            <input
              name="phone"
              type="tel"
              defaultValue={spot.phone ?? ""}
              placeholder="0917 123 4567"
              className="rounded-full border border-black/10 px-4 py-2.5 text-base font-normal outline-none focus:border-navey-ink sm:text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Website
            <input
              name="website"
              type="url"
              defaultValue={spot.website ?? ""}
              placeholder="example.com"
              className="rounded-full border border-black/10 px-4 py-2.5 text-base font-normal outline-none focus:border-navey-ink sm:text-sm"
            />
          </label>
        </div>
      </div>

      {/* Prices are the one thing a map listing never shows. "₱₱" is true of
          most of Metro Manila; "Latte ₱170" is the actual answer. */}
      <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
        <p className="font-heading font-bold">What it costs</p>
        <p className="mt-1 text-xs text-navey-ink/50">
          Two or three real prices off the menu board. A row needs both a name
          and a price to be saved.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {Array.from({ length: PRICE_ANCHOR_SLOTS }, (_, slot) => (
            <div key={slot} className="flex gap-2">
              <input
                name={`anchorItem${slot}`}
                type="text"
                defaultValue={spot.priceAnchors[slot]?.item ?? ""}
                placeholder={
                  ["Latte", "Americano", "Pastry"][slot] ?? "Item"
                }
                className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-base outline-none focus:border-navey-ink sm:text-sm"
              />
              <input
                name={`anchorPrice${slot}`}
                type="number"
                min={1}
                defaultValue={spot.priceAnchors[slot]?.pricePhp ?? ""}
                placeholder="170"
                className="w-28 rounded-full border border-black/10 px-4 py-2.5 text-base outline-none focus:border-navey-ink sm:text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* A directory is only worth opening if its hours are true. Saying when
          somebody last looked is the cheapest credibility on the site. */}
      <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,18,11,0.08)]">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            name="detailsChecked"
            defaultChecked={Boolean(spot.detailsCheckedAt)}
          />
          Details confirmed
        </label>
        <input
          type="hidden"
          name="detailsCheckedAt"
          value={spot.detailsCheckedAt ?? ""}
        />
        <p className="mt-1 text-xs text-navey-ink/50">
          {spot.detailsCheckedAt
            ? `Shows "Details checked" from ${spot.detailsCheckedAt}. Untick to remove it.`
            : "Ticking this stamps today's date on the listing."}
        </p>
      </div>

      <p className="text-xs text-navey-ink/50">
        Photos and menus are managed from the listing&apos;s Owner Dashboard.
      </p>

      <SaveButton />
    </form>
  );
}
