-- The category column has allowed exactly three values since the table was
-- created: coffee_shop, restaurant, both.
--
-- The app has offered a fourth for some time. src/lib/categories.ts lists
-- "Bakery & Pastries", the admin form shows it, and choosing it produces a
-- failed save with a constraint error -- a choice the interface offers and the
-- database refuses. Nobody noticed because nothing on the site is a bakery yet.
--
-- Widened here rather than dropped altogether. The constraint is what stops a
-- typo becoming a category: without it, "Resturant" saves happily and then
-- renders as a raw string on a public page, and no amount of care in the forms
-- prevents a direct database edit from doing it.
--
-- The new values are the kinds this country actually has in numbers. Milk tea
-- is its own category rather than a coffee shop, because nobody searching for
-- boba wants a flat white and the two are not substitutes. Bars are their own
-- thing for the same reason. Dessert covers the ice cream and cake shops that
-- are neither a bakery nor a cafe.

alter table public.spots
  drop constraint if exists spots_category_check;

alter table public.spots
  add constraint spots_category_check check (
    category in (
      'coffee_shop',
      'restaurant',
      'bakery',
      'bar',
      'dessert',
      'milk_tea',
      'both'
    )
  );

comment on column public.spots.category is
  'What kind of place this is. The allowed values are mirrored in
   src/lib/categories.ts, which also holds each one''s label and its schema.org
   type -- keep the two in step, and widen this constraint before adding a
   value to that file.';
