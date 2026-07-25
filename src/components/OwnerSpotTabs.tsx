"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addMenuPhotos,
  deleteMenuPhoto,
  updateAmenities,
  updateBasicInfo,
  updateHours,
  updatePayments,
} from "@/app/owner/[spotId]/actions";
import { PhotoPicker } from "@/components/PhotoPicker";
import type { OwnerSpotDetail } from "@/lib/owner";

const MAX_MENU_PHOTOS = 9;

const CATEGORIES = [
  { value: "coffee_shop", label: "Coffee Shop" },
  { value: "restaurant", label: "Restaurant" },
  { value: "both", label: "Both" },
];

const PRICES = ["₱", "₱₱", "₱₱₱"];

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

type Tab = "overview" | "hours" | "payments" | "amenities" | "menu";

export function OwnerSpotTabs({
  spot,
  tags,
  initialTab,
}: {
  spot: OwnerSpotDetail;
  tags: { id: number; label: string }[];
  initialTab: string;
}) {
  const [tab, setTab] = useState<Tab>(
    (["overview", "hours", "payments", "amenities", "menu"] as string[]).includes(
      initialTab
    )
      ? (initialTab as Tab)
      : "overview"
  );
  const [category, setCategory] = useState(spot.category);
  const [priceRange, setPriceRange] = useState(spot.priceRange ?? "₱₱");
  const [selectedTags, setSelectedTags] = useState<number[]>(spot.tagIds);

  function toggleTag(id: number) {
    setSelectedTags((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    );
  }

  const hourByDay = new Map(spot.hours.map((h) => [h.dayOfWeek, h]));

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "hours", label: "Hours" },
    { id: "payments", label: "Payments" },
    { id: "amenities", label: "Amenities & Vibe" },
    { id: "menu", label: "Menu" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-black/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-semibold ${
              tab === t.id
                ? "border-b-2 border-navey-ink text-navey-ink"
                : "text-navey-ink/50 hover:text-navey-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-xl py-8">
        {tab === "overview" && (
          <form action={updateBasicInfo} className="flex flex-col gap-4">
            <input type="hidden" name="spotId" value={spot.id} />
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
                name="address"
                type="text"
                defaultValue={spot.address}
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
                  name="city"
                  type="text"
                  defaultValue={spot.city}
                  required
                  className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="province" className="text-sm font-semibold">
                  Province
                </label>
                <input
                  id="province"
                  name="province"
                  type="text"
                  defaultValue={spot.province ?? ""}
                  className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
                />
              </div>
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
                className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
              />
            </div>

            <SaveButton label="Save Overview" />
          </form>
        )}

        {tab === "hours" && (
          <form action={updateHours} className="flex flex-col gap-4">
            <input type="hidden" name="spotId" value={spot.id} />
            {DAY_LABELS.map((label, day) => {
              const existing = hourByDay.get(day);
              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
                >
                  <span className="w-24 text-sm font-semibold">{label}</span>
                  <label className="flex items-center gap-2 text-xs text-navey-ink/70">
                    <input
                      type="checkbox"
                      name={`closed_${day}`}
                      defaultChecked={existing?.isClosed ?? false}
                    />
                    Closed
                  </label>
                  <input
                    type="text"
                    name={`open_${day}`}
                    placeholder="Open (e.g. 8:00 AM)"
                    defaultValue={existing?.openTime ?? ""}
                    className="min-w-[140px] flex-1 rounded-full border border-black/10 px-3 py-2 text-xs outline-none focus:border-navey-ink"
                  />
                  <input
                    type="text"
                    name={`close_${day}`}
                    placeholder="Close (e.g. 9:00 PM)"
                    defaultValue={existing?.closeTime ?? ""}
                    className="min-w-[140px] flex-1 rounded-full border border-black/10 px-3 py-2 text-xs outline-none focus:border-navey-ink"
                  />
                </div>
              );
            })}
            <SaveButton label="Save Hours" />
          </form>
        )}

        {tab === "payments" && (
          <form action={updatePayments} className="flex flex-col gap-4">
            <input type="hidden" name="spotId" value={spot.id} />
            {[
              { key: "accepts_cash", label: "Cash", checked: spot.acceptsCash },
              { key: "accepts_qr_ph", label: "QR Ph", checked: spot.acceptsQrPh },
              { key: "accepts_cards", label: "Cards", checked: spot.acceptsCards },
              {
                key: "accepts_bank_transfer",
                label: "Bank Transfer",
                checked: spot.acceptsBankTransfer,
              },
            ].map((field) => (
              <label
                key={field.key}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
              >
                <input
                  type="checkbox"
                  name={field.key}
                  defaultChecked={field.checked}
                />
                {field.label}
              </label>
            ))}
            <SaveButton label="Save Payments" />
          </form>
        )}

        {tab === "amenities" && (
          <form action={updateAmenities} className="flex flex-col gap-6">
            <input type="hidden" name="spotId" value={spot.id} />

            <div>
              <p className="mb-2 text-sm font-semibold">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleTag(option.id)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      selectedTags.includes(option.id)
                        ? "bg-navey-ink text-navey-yellow"
                        : "bg-navey-band"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {selectedTags.map((id) => (
                <input key={id} type="hidden" name="tagIds" value={id} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="noiseLevel" className="text-sm font-semibold">
                  Noise Level
                </label>
                <input
                  id="noiseLevel"
                  name="noiseLevel"
                  type="text"
                  defaultValue={spot.noiseLevel ?? ""}
                  placeholder="e.g. Quiet"
                  className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="musicStyle" className="text-sm font-semibold">
                  Music
                </label>
                <input
                  id="musicStyle"
                  name="musicStyle"
                  type="text"
                  defaultValue={spot.musicStyle ?? ""}
                  placeholder="e.g. Lo-fi"
                  className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lighting" className="text-sm font-semibold">
                  Lighting
                </label>
                <input
                  id="lighting"
                  name="lighting"
                  type="text"
                  defaultValue={spot.lighting ?? ""}
                  placeholder="e.g. Warm"
                  className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="seatingStyle" className="text-sm font-semibold">
                  Seating
                </label>
                <input
                  id="seatingStyle"
                  name="seatingStyle"
                  type="text"
                  defaultValue={spot.seatingStyle ?? ""}
                  placeholder="e.g. Communal tables"
                  className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
                />
              </div>
            </div>

            <SaveButton label="Save Amenities & Vibe" />
          </form>
        )}

        {tab === "menu" && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-sm font-semibold">Current menu photos</p>
              {spot.menuPhotos.length === 0 ? (
                <p className="text-sm text-navey-ink/50">
                  No menu photos uploaded yet.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {spot.menuPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-[3/4] overflow-hidden rounded-xl bg-navey-band"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL */}
                      <img
                        src={photo.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <form
                        action={deleteMenuPhoto}
                        className="absolute right-1 top-1"
                      >
                        <input type="hidden" name="spotId" value={spot.id} />
                        <input type="hidden" name="photoId" value={photo.id} />
                        <button
                          type="submit"
                          aria-label="Remove photo"
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {spot.menuPhotos.length < MAX_MENU_PHOTOS && (
              <form action={addMenuPhotos} className="flex flex-col gap-4">
                <input type="hidden" name="spotId" value={spot.id} />
                <div>
                  <p className="mb-2 text-sm font-semibold">Add menu photos</p>
                  <PhotoPicker
                    name="photos"
                    max={MAX_MENU_PHOTOS - spot.menuPhotos.length}
                    aspect="aspect-[3/4]"
                  />
                </div>
                <SaveButton label="Upload Photos" />
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
