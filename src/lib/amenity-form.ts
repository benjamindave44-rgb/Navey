import {
  LAPTOP_OPTIONS,
  OUTLET_OPTIONS,
  PARKING_OPTIONS,
  WIFI_OPTIONS,
} from "@/lib/amenities";
import { instagramHandle, websiteUrl } from "@/lib/contact";

/**
 * Reading the practical fields back out of a submitted form.
 *
 * Shared between the admin form and the owner dashboard so the two cannot end
 * up disagreeing about what an empty chip means. Every one of these columns has
 * a check constraint on it, so a value that is not on the list is not a
 * cosmetic problem -- it is a failed save with a database error in it. Filtering
 * here means an unexpected value becomes "not checked", which is both true and
 * harmless.
 */

/** Three anchors is enough to place a menu and few enough to fill in quickly.
 *  A dynamic add-a-row list would be more general and less likely to be used. */
export const PRICE_ANCHOR_SLOTS = 3;

function oneOf(value: FormDataEntryValue | null, allowed: string[]): string | null {
  const text = String(value ?? "").trim();
  return allowed.includes(text) ? text : null;
}

/** "yes" / "no" / anything else. Anything else is "nobody has checked", which
 *  is deliberately different from "no". */
function triState(value: FormDataEntryValue | null): boolean | null {
  const text = String(value ?? "").trim();
  if (text === "yes") return true;
  if (text === "no") return false;
  return null;
}

function trimmedOrNull(value: FormDataEntryValue | null, max: number): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return text.slice(0, max);
}

/** The columns on `spots`, ready to hand to an update. */
export function amenityColumnsFromForm(formData: FormData) {
  return {
    wifi: oneOf(formData.get("wifi"), WIFI_OPTIONS.map((o) => o.value)),
    power_outlets: oneOf(
      formData.get("powerOutlets"),
      OUTLET_OPTIONS.map((o) => o.value)
    ),
    laptop_friendly: oneOf(
      formData.get("laptopFriendly"),
      LAPTOP_OPTIONS.map((o) => o.value)
    ),
    has_aircon: triState(formData.get("hasAircon")),
    has_outdoor_seating: triState(formData.get("hasOutdoorSeating")),
    parking: oneOf(formData.get("parking"), PARKING_OPTIONS.map((o) => o.value)),
    // Stored as a bare handle so every link is built the same way. A pasted
    // profile URL is reduced to the handle rather than rejected, because
    // pasting the URL is what people actually do.
    instagram: instagramHandle(String(formData.get("instagram") ?? "")),
    phone: trimmedOrNull(formData.get("phone"), 40),
    // Normalised on the way in as well as on the way out: a stored
    // "javascript:..." is a stored hazard even if every reader happens to
    // filter it today.
    website: websiteUrl(String(formData.get("website") ?? "")),
    details_checked_at: detailsCheckedFromForm(formData),
  };
}

/**
 * "Checked today" as a single tick rather than a date picker.
 *
 * Unticking it clears the date, which is the honest behaviour: if somebody
 * decides the details are not confirmed after all, the page should stop
 * claiming they were.
 */
function detailsCheckedFromForm(formData: FormData): string | null {
  if (formData.get("detailsChecked") !== "on") return null;

  const existing = String(formData.get("detailsCheckedAt") ?? "").trim();
  // Keep the date that was already there unless this is a fresh tick, so
  // opening a listing and saving it does not silently re-date every check.
  if (/^\d{4}-\d{2}-\d{2}$/.test(existing)) return existing;

  return todayInManila();
}

/** Today's date in Manila, as YYYY-MM-DD. The server runs in UTC, so reading
 *  its own date puts this a day out for eight hours of every day. */
export function todayInManila(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  // en-CA formats as YYYY-MM-DD, which is what Postgres wants for a date.
  return parts;
}

export type PriceAnchorInput = {
  spot_id: string;
  item: string;
  price_php: number;
  sort_order: number;
};

/**
 * The price anchors, as rows ready to insert.
 *
 * A slot needs both a name and a price to count. Half-filled slots are dropped
 * rather than saved as "₱0" or as a nameless number, because either would show
 * up on the public page as nonsense.
 */
export function priceAnchorsFromForm(
  formData: FormData,
  spotId: string
): PriceAnchorInput[] {
  const rows: PriceAnchorInput[] = [];

  for (let slot = 0; slot < PRICE_ANCHOR_SLOTS; slot++) {
    const item = String(formData.get(`anchorItem${slot}`) ?? "").trim();
    const priceRaw = String(formData.get(`anchorPrice${slot}`) ?? "").trim();
    if (!item || !priceRaw) continue;

    const price = Math.round(Number(priceRaw));
    // Matches the check constraint in migration 0039, so a bad number is
    // dropped here rather than rejected by the database mid-save.
    if (!Number.isFinite(price) || price <= 0 || price >= 100000) continue;

    rows.push({
      spot_id: spotId,
      item: item.slice(0, 60),
      price_php: price,
      sort_order: rows.length,
    });
  }

  return rows;
}
