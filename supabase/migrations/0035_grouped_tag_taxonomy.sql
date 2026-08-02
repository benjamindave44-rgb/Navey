-- Navey started as a coffee guide, so every tag described a cafe: WiFi,
-- Charging, Work Friendly. Restaurants need a different vocabulary, and a
-- flat list of thirty-odd chips is harder to use than ten, not easier --
-- so tags are grouped and ordered.
--
-- The icon column now holds the emoji itself rather than a key that had to be
-- mapped in the code. Adding a tag is then a row, not a deploy.

alter table public.tags
  add column if not exists tag_group text not null default 'Practical',
  add column if not exists sort_order integer not null default 100;

update public.tags set icon = '📶', tag_group = 'Practical', sort_order = 501 where label = 'WiFi';
update public.tags set icon = '🕐', tag_group = 'Practical', sort_order = 503 where label = '24 Hours';
update public.tags set icon = '💎', tag_group = 'Standout',  sort_order = 601 where label = 'Hidden Gems';
update public.tags set icon = '🛋️', tag_group = 'Vibe',      sort_order = 101 where label = 'Chill';
update public.tags set icon = '❤️', tag_group = 'Good for',  sort_order = 301 where label = 'Date Spot';
update public.tags set icon = '🔌', tag_group = 'Practical', sort_order = 502 where label = 'Charging';
update public.tags set icon = '💻', tag_group = 'Good for',  sort_order = 305 where label = 'Work Friendly';
update public.tags set icon = '🐾', tag_group = 'Practical', sort_order = 505 where label = 'Pet Friendly';
update public.tags set icon = '🚻', tag_group = 'Practical', sort_order = 507 where label = 'Comfort Room';
update public.tags set icon = '♿', tag_group = 'Practical', sort_order = 506 where label = 'PWD Friendly';

insert into public.tags (label, icon, tag_group, sort_order) values
  ('Lively',             '🎉', 'Vibe',          102),
  ('Quiet',              '🤫', 'Vibe',          103),
  ('Cozy',               '🕯️', 'Vibe',          104),
  ('Instagrammable',     '📸', 'Vibe',          105),

  ('Rooftop',            '🌆', 'Setting',       201),
  ('Outdoor Seating',    '🌤️', 'Setting',       202),
  ('Garden',             '🌿', 'Setting',       203),
  ('Beachfront',         '🏖️', 'Setting',       204),
  ('Air-conditioned',    '❄️', 'Setting',       205),

  ('Barkada Hangout',    '👯', 'Good for',      302),
  ('Family Friendly',    '👨‍👩‍👧', 'Good for',   303),
  ('Solo Friendly',      '🧘', 'Good for',      304),
  ('Big Groups',         '🍽️', 'Good for',      306),

  ('Unlimited Rice',     '🍚', 'Food & Drink',  401),
  ('Unlimited Chicken',  '🍗', 'Food & Drink',  402),
  ('Buffet',             '🍤', 'Food & Drink',  403),
  ('All-Day Breakfast',  '🍳', 'Food & Drink',  404),
  ('Silog Meals',        '🥚', 'Food & Drink',  405),
  ('Grilled & Inasal',   '🔥', 'Food & Drink',  406),
  ('Seafood',            '🦐', 'Food & Drink',  407),
  ('Vegetarian Options', '🥗', 'Food & Drink',  408),
  ('Halal',              '☪️', 'Food & Drink',  409),
  ('Desserts',           '🍰', 'Food & Drink',  410),
  ('Local Coffee',       '☕', 'Food & Drink',  411),
  ('Milk Tea',           '🧋', 'Food & Drink',  412),
  ('Craft Beer',         '🍺', 'Food & Drink',  413),

  ('Parking',            '🅿️', 'Practical',     504),
  ('Reservations',       '📞', 'Practical',     508),
  ('Takeout & Delivery', '🛵', 'Practical',     509)
on conflict (label) do nothing;
