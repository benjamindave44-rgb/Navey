/**
 * What kind of place a listing is. Defined once because it was previously
 * written out in eight files -- the pickers, the cards, the spot page, the
 * explore filter and the review queue -- so adding a kind meant finding all
 * eight, and missing one showed a raw value like "coffee_shop" to a visitor.
 *
 * `schemaType` is what search engines are told the place is. Getting it right
 * is what lets a result show as a bakery rather than a generic business.
 */
export type SpotCategory = {
  value: string;
  label: string;
  schemaType: string;
  /**
   * The dot on the Explore map.
   *
   * Here rather than in the map component, because the map kept its own list
   * of three colours and quietly fell behind: a bakery was drawn in exactly
   * the same black as a coffee shop, so the map claimed two different kinds of
   * place were the same kind. A category now carries everything that must be
   * true about it in one place.
   */
  color: string;
};

/**
 * Every value here must also be allowed by the check constraint on
 * `spots.category` -- see migration 0041. Adding one here alone produces a
 * choice the form offers and the database refuses, which is exactly what
 * happened to "Bakery & Pastries" for months.
 */
export const SPOT_CATEGORIES: SpotCategory[] = [
  {
    value: "coffee_shop",
    label: "Coffee Shop",
    schemaType: "CafeOrCoffeeShop",
    color: "#14120B",
  },
  {
    value: "restaurant",
    label: "Restaurant",
    schemaType: "Restaurant",
    color: "#B45309",
  },
  // A patisserie is neither a cafe nor a restaurant, and calling it either
  // makes it harder to find for the thing it is actually known for.
  {
    value: "bakery",
    label: "Bakery & Pastries",
    schemaType: "Bakery",
    color: "#CA8A04",
  },
  // Milk tea is not a coffee shop. Nobody looking for boba wants a flat white,
  // and in this country it is a category of its own by volume, not a niche.
  {
    value: "milk_tea",
    label: "Milk Tea & Boba",
    schemaType: "CafeOrCoffeeShop",
    color: "#0891B2",
  },
  {
    value: "bar",
    label: "Bar & Cocktails",
    schemaType: "BarOrPub",
    color: "#15803D",
  },
  // The ice cream and cake shops that are neither a bakery nor a cafe.
  {
    value: "dessert",
    label: "Dessert & Ice Cream",
    schemaType: "IceCreamShop",
    color: "#DB2777",
  },
  {
    value: "both",
    label: "Coffee Shop & Restaurant",
    schemaType: "FoodEstablishment",
    color: "#7C3AED",
  },
];

/** The fallback dot colour for a value no longer in the list above. */
export const UNKNOWN_CATEGORY_COLOR = "#6B7280";

const BY_VALUE = new Map(SPOT_CATEGORIES.map((entry) => [entry.value, entry]));

/** Falls back to the stored value so an unknown kind is visible rather than
 *  silently blank -- easier to notice and fix than an empty space. */
export function categoryLabel(value: string): string {
  return BY_VALUE.get(value)?.label ?? value;
}

export function categoryColor(value: string): string {
  return BY_VALUE.get(value)?.color ?? UNKNOWN_CATEGORY_COLOR;
}

export function categorySchemaType(value: string): string {
  return BY_VALUE.get(value)?.schemaType ?? "FoodEstablishment";
}

/**
 * These two split the catalogue for the one-line summary on city and
 * neighbourhood pages ("eleven for coffee and four for a proper meal"), so
 * every category needs to fall on one side or the other. A kind that belongs
 * to neither disappears from that sentence and makes the page describe itself
 * wrongly.
 */

/** Anywhere someone would go primarily to sit down and eat or drink an
 *  evening. Bars count: a bar is somewhere you go *to*, not somewhere you
 *  grab a cup from. */
export function servesMeals(value: string): boolean {
  return value === "restaurant" || value === "bar" || value === "both";
}

/** Anywhere built around a drink or something sweet rather than a meal. */
export function servesCoffeeOrBakes(value: string): boolean {
  return (
    value === "coffee_shop" ||
    value === "bakery" ||
    value === "milk_tea" ||
    value === "dessert" ||
    value === "both"
  );
}
