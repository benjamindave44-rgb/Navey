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
};

export const SPOT_CATEGORIES: SpotCategory[] = [
  { value: "coffee_shop", label: "Coffee Shop", schemaType: "CafeOrCoffeeShop" },
  { value: "restaurant", label: "Restaurant", schemaType: "Restaurant" },
  // A patisserie is neither a cafe nor a restaurant, and calling it either
  // makes it harder to find for the thing it is actually known for.
  { value: "bakery", label: "Bakery & Pastries", schemaType: "Bakery" },
  { value: "both", label: "Coffee Shop & Restaurant", schemaType: "FoodEstablishment" },
];

const BY_VALUE = new Map(SPOT_CATEGORIES.map((entry) => [entry.value, entry]));

/** Falls back to the stored value so an unknown kind is visible rather than
 *  silently blank -- easier to notice and fix than an empty space. */
export function categoryLabel(value: string): string {
  return BY_VALUE.get(value)?.label ?? value;
}

export function categorySchemaType(value: string): string {
  return BY_VALUE.get(value)?.schemaType ?? "FoodEstablishment";
}

/** True for anywhere someone would go primarily to eat a meal. */
export function servesMeals(value: string): boolean {
  return value === "restaurant" || value === "both";
}

/** True for anywhere built around coffee or baked goods rather than meals. */
export function servesCoffeeOrBakes(value: string): boolean {
  return value === "coffee_shop" || value === "bakery" || value === "both";
}
