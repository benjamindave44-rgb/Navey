"use client";

import { useState } from "react";
import { SPOT_CATEGORIES } from "@/lib/categories";
import { useFormStatus } from "react-dom";
import {
  addGalleryPhotos,
  addMenuPhotos,
  deleteGalleryPhoto,
  deleteMenuPhoto,
  updateAmenities,
  updateBasicInfo,
  updateHours,
  updatePayments,
} from "@/app/owner/[spotId]/actions";
import { OwnerHoursEditor } from "@/components/OwnerHoursEditor";
import { PhotoPicker } from "@/components/PhotoPicker";
import { PHOTO_LIMITS, UPLOAD_LIMIT_LABEL } from "@/lib/upload-limits";
import { LocationFields } from "@/components/LocationFields";
import type { OwnerSpotDetail } from "@/lib/owner";
import type { Tag } from "@/lib/queries";
import { TagPicker } from "@/components/TagPicker";



const PRICES = ["₱", "₱₱", "₱₱₱"];

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

function PhotoManager({
  spotId,
  photos,
  max,
  aspect,
  addAction,
  deleteAction,
  emptyLabel,
  addLabel,
  accept,
  helpText,
}: {
  spotId: string;
  photos: { id: string; url: string }[];
  max: number;
  aspect: string;
  addAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  emptyLabel: string;
  addLabel: string;
  accept?: string;
  helpText?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-semibold">Current photos</p>
        {photos.length === 0 ? (
          <p className="text-sm text-navey-ink/50">{emptyLabel}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`relative ${aspect} overflow-hidden rounded-xl bg-navey-band`}
              >
                {photo.url.toLowerCase().endsWith(".pdf") ? (
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center hover:bg-navey-band/60"
                  >
                    <span aria-hidden className="text-2xl">
                      📄
                    </span>
                    <span className="text-[10px] font-semibold text-navey-ink/70">
                      PDF menu
                    </span>
                  </a>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL */
                  <img
                    src={photo.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                <form action={deleteAction} className="absolute right-1 top-1">
                  <input type="hidden" name="spotId" value={spotId} />
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

      {photos.length < max && (
        <form action={addAction} className="flex flex-col gap-4">
          <input type="hidden" name="spotId" value={spotId} />
          <div>
            <p className="mb-2 text-sm font-semibold">{addLabel}</p>
            <PhotoPicker
              name="photos"
              max={max - photos.length}
              aspect={aspect}
              accept={accept}
              helpText={helpText}
            />
          </div>
          <SaveButton label="Upload Photos" />
        </form>
      )}
    </div>
  );
}

type Tab = "overview" | "hours" | "payments" | "amenities" | "gallery" | "menu";

export function OwnerSpotTabs({
  spot,
  tags,
  initialTab,
}: {
  spot: OwnerSpotDetail;
  tags: Tag[];
  initialTab: string;
}) {
  const [tab, setTab] = useState<Tab>(
    (
      ["overview", "hours", "payments", "amenities", "gallery", "menu"] as string[]
    ).includes(initialTab)
      ? (initialTab as Tab)
      : "overview"
  );
  const [category, setCategory] = useState(spot.category);
  const [priceRange, setPriceRange] = useState(spot.priceRange ?? "₱₱");


  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "hours", label: "Hours" },
    { id: "payments", label: "Payments" },
    { id: "amenities", label: "Amenities & Vibe" },
    { id: "gallery", label: "Gallery" },
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

            <SaveButton label="Save Overview" />
          </form>
        )}

        {tab === "hours" && (
          <form action={updateHours} className="flex flex-col gap-4">
            <input type="hidden" name="spotId" value={spot.id} />
            <OwnerHoursEditor hours={spot.hours} />
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
              <TagPicker tags={tags} initialSelected={spot.tagIds} />
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

        {tab === "gallery" && (
          <PhotoManager
            spotId={spot.id}
            photos={spot.galleryPhotos}
            max={PHOTO_LIMITS.gallery}
            aspect="aspect-square"
            addAction={addGalleryPhotos}
            deleteAction={deleteGalleryPhoto}
            emptyLabel="No gallery photos uploaded yet."
            addLabel="Add gallery photos"
          />
        )}

        {tab === "menu" && (
          <PhotoManager
            spotId={spot.id}
            photos={spot.menuPhotos}
            max={PHOTO_LIMITS.menu}
            aspect="aspect-[3/4]"
            addAction={addMenuPhotos}
            deleteAction={deleteMenuPhoto}
            emptyLabel="No menu uploaded yet."
            addLabel="Add menu photos or a PDF"
            accept="image/*,application/pdf"
            helpText={`Up to ${PHOTO_LIMITS.menu} pages. A long menu goes up a few at a time — upload, save, then add more. One PDF covers the whole thing if it fits ${UPLOAD_LIMIT_LABEL}.`}
          />
        )}
      </div>
    </div>
  );
}
