do $$
declare
  v_collection_id uuid;
  v_shaka_id uuid;
  v_sonya_id uuid;
  v_le_chef_id uuid;
begin
  select id into v_shaka_id from public.spots where name = 'Shaka Beach Bar & Coffee';
  select id into v_sonya_id from public.spots where name = 'Sonya''s Garden Cafe';
  select id into v_le_chef_id from public.spots where name = 'Le Chef''s Kitchen';

  insert into public.collections (title, description)
  values ('Hidden Gems Worth the Trip', 'Off-the-beaten-path spots our community keeps coming back to.')
  returning id into v_collection_id;

  insert into public.collection_spots (collection_id, spot_id, rank) values
    (v_collection_id, v_shaka_id, 1),
    (v_collection_id, v_sonya_id, 2),
    (v_collection_id, v_le_chef_id, 3);
end $$;
