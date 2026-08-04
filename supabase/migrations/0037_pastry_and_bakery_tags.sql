-- "Desserts" was carrying too much. Halo-halo, a slice of cake and a morning
-- croissant are not the same craving, and someone hunting an ensaymada will
-- not think to look under dessert. Baked goods get their own words, ordered to
-- sit together in the picker.

update public.tags set sort_order = 414 where label = 'Local Coffee';
update public.tags set sort_order = 415 where label = 'Milk Tea';
update public.tags set sort_order = 416 where label = 'Craft Beer';

-- Ice cream reads as dessert-proper now that baked goods have moved out.
update public.tags set icon = '🍨' where label = 'Desserts';

insert into public.tags (label, icon, tag_group, sort_order) values
  ('Pastries',    '🥐', 'Food & Drink', 411),
  ('Cakes',       '🎂', 'Food & Drink', 412),
  ('Fresh Bread', '🥖', 'Food & Drink', 413)
on conflict (label) do nothing;
