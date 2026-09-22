/**
 * The practical facts about a place, and the words used for them.
 *
 * The listings already carried noise level, seating style, music style and
 * lighting -- four ways of describing a mood -- and not one of wifi, power
 * outlets or aircon. That is backwards for this country: nobody picks a cafe
 * on its lighting, and a great many people pick one on whether they can plug
 * a laptop in and whether the aircon works.
 *
 * Every value here is three-state. Null means nobody has checked, and shows
 * nothing at all -- the same principle as open-status.ts, where "unknown" is
 * a real answer. Printing "No wifi" because a column is empty is a lie that
 * costs a shop a customer.
 *
 * One file owns these words so the admin form, the filters, the cards and the
 * listing page cannot drift into describing the same column differently.
 */

export type AmenityOption<T extends string> = {
  value: T;
  /** What the admin form offers. */
  label: string;
  /** What a visitor reads on the listing. Often the same; sometimes blunter. */
  public: string;
};

export const WIFI_OPTIONS: AmenityOption<"none" | "patchy" | "good">[] = [
  { value: "good", label: "Good wifi", public: "Good wifi" },
  { value: "patchy", label: "Patchy wifi", public: "Patchy wifi" },
  { value: "none", label: "No wifi", public: "No wifi" },
];

export const OUTLET_OPTIONS: AmenityOption<"none" | "few" | "plenty">[] = [
  { value: "plenty", label: "Plenty of outlets", public: "Plenty of outlets" },
  { value: "few", label: "A few outlets", public: "A few outlets" },
  { value: "none", label: "No outlets", public: "No outlets" },
];

export const LAPTOP_OPTIONS: AmenityOption<
  "welcome" | "limited" | "discouraged"
>[] = [
  { value: "welcome", label: "Laptops welcome", public: "Laptops welcome" },
  {
    value: "limited",
    label: "Time limit at peak",
    // Said plainly, because arriving at noon to be moved on at one is the
    // exact unpleasant surprise this field exists to prevent.
    public: "Time limit at peak hours",
  },
  {
    value: "discouraged",
    label: "Not for working",
    public: "Not a working cafe",
  },
];

export const PARKING_OPTIONS: AmenityOption<
  "none" | "street" | "building" | "valet"
>[] = [
  {
    value: "building",
    label: "Building parking",
    // Covers the mall and office-tower case, which is most of BGC.
    public: "Parking in the building",
  },
  { value: "street", label: "Street parking", public: "Street parking" },
  { value: "valet", label: "Valet", public: "Valet parking" },
  { value: "none", label: "No parking", public: "No parking" },
];

function labelFor<T extends string>(
  options: AmenityOption<T>[],
  value: string | null | undefined
): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.public ?? null;
}

export type AmenitySource = {
  wifi?: string | null;
  power_outlets?: string | null;
  laptop_friendly?: string | null;
  has_aircon?: boolean | null;
  has_outdoor_seating?: boolean | null;
  parking?: string | null;
};

/** A chip carries its own tone, because "No outlets" and "Plenty of outlets"
 *  should not look alike at a glance. */
export type AmenityChip = { text: string; tone: "good" | "mixed" | "poor" };

/**
 * "Can I work here?" -- the three facts that answer it, in the order somebody
 * asks them. Returns an empty list when nothing has been checked, so the
 * caller can leave the whole section out rather than print an empty heading.
 */
export function workChips(spot: AmenitySource): AmenityChip[] {
  const chips: AmenityChip[] = [];

  const wifi = labelFor(WIFI_OPTIONS, spot.wifi);
  if (wifi) {
    chips.push({
      text: wifi,
      tone:
        spot.wifi === "good" ? "good" : spot.wifi === "patchy" ? "mixed" : "poor",
    });
  }

  const outlets = labelFor(OUTLET_OPTIONS, spot.power_outlets);
  if (outlets) {
    chips.push({
      text: outlets,
      tone:
        spot.power_outlets === "plenty"
          ? "good"
          : spot.power_outlets === "few"
            ? "mixed"
            : "poor",
    });
  }

  const laptop = labelFor(LAPTOP_OPTIONS, spot.laptop_friendly);
  if (laptop) {
    chips.push({
      text: laptop,
      tone:
        spot.laptop_friendly === "welcome"
          ? "good"
          : spot.laptop_friendly === "limited"
            ? "mixed"
            : "poor",
    });
  }

  return chips;
}

/**
 * Comfort and getting there: aircon, outside seating, parking.
 *
 * Aircon is on this list because it is a genuinely Philippine question. At two
 * in the afternoon in Makati it decides the whole visit, and no international
 * directory thinks to ask it.
 */
export function comfortChips(spot: AmenitySource): AmenityChip[] {
  const chips: AmenityChip[] = [];

  if (spot.has_aircon === true) chips.push({ text: "Aircon", tone: "good" });
  if (spot.has_aircon === false) chips.push({ text: "No aircon", tone: "poor" });

  if (spot.has_outdoor_seating === true) {
    chips.push({ text: "Outdoor seating", tone: "good" });
  }

  const parking = labelFor(PARKING_OPTIONS, spot.parking);
  if (parking) {
    chips.push({
      text: parking,
      tone: spot.parking === "none" ? "poor" : "good",
    });
  }

  return chips;
}

/**
 * The one-line version for a card, where there is room for two facts at most.
 *
 * Wifi and outlets win because between them they answer the question most
 * people are scanning a list of cafes to answer.
 */
export function cardAmenitySummary(spot: AmenitySource): string | null {
  const parts: string[] = [];

  if (spot.wifi === "good") parts.push("Good wifi");
  if (spot.power_outlets === "plenty") parts.push("Plenty of outlets");
  else if (spot.power_outlets === "few") parts.push("Some outlets");

  if (parts.length === 0 && spot.has_aircon === true) parts.push("Aircon");

  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Peso amounts, as written on a menu board: no decimals, thousands grouped. */
export function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString("en-PH")}`;
}
