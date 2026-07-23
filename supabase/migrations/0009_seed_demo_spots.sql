do $$
declare
  v_id uuid;
begin
  insert into public.spots (name, category, price_range, city, province, address, description, hidden_gem, status, noise_level, music_style, lighting, seating_style)
  values ('Commune Cafe', 'coffee_shop', '₱₱', 'Taguig', 'Metro Manila', '35th corner Rizal Drive, BGC', 'A minimalist specialty coffee bar loved by BGC locals for its single-origin pour-overs and quiet work corners.', false, 'approved', 'Moderate', 'Lo-fi', 'Bright', 'Communal tables')
  returning id into v_id;
  insert into public.spot_tags (spot_id, tag_id)
  select v_id, id from public.tags where label in ('WiFi', 'Work Friendly', 'Chill');

  insert into public.spots (name, category, price_range, city, province, address, description, hidden_gem, status, noise_level, music_style, lighting, seating_style)
  values ('Kuppa Roasters', 'coffee_shop', '₱', 'Cebu City', 'Cebu', 'Salinas Drive, Lahug', 'A 24-hour roastery favorite for late-night study sessions and strong cold brew.', false, 'approved', 'Lively', 'Indie', 'Warm', 'Bar seating')
  returning id into v_id;
  insert into public.spot_tags (spot_id, tag_id)
  select v_id, id from public.tags where label in ('24 Hours', 'WiFi', 'Charging');

  insert into public.spots (name, category, price_range, city, province, address, description, hidden_gem, status, noise_level, music_style, lighting, seating_style)
  values ('Le Chef''s Kitchen', 'restaurant', '₱₱₱', 'Baguio City', 'Benguet', 'Legarda Road', 'A cozy pine-forest restaurant known for candlelit dinners and mountain views.', false, 'approved', 'Quiet', 'Jazz', 'Dim', 'Booth seating')
  returning id into v_id;
  insert into public.spot_tags (spot_id, tag_id)
  select v_id, id from public.tags where label in ('Date Spot', 'Chill');

  insert into public.spots (name, category, price_range, city, province, address, description, hidden_gem, status, noise_level, music_style, lighting, seating_style)
  values ('Shaka Beach Bar & Coffee', 'both', '₱₱', 'General Luna', 'Surigao del Norte', 'Tourism Road, Cloud 9', 'A surfer-run beachfront spot serving coffee by day and cocktails by night, steps from the break.', true, 'approved', 'Lively', 'Reggae', 'Bright', 'Outdoor seating')
  returning id into v_id;
  insert into public.spot_tags (spot_id, tag_id)
  select v_id, id from public.tags where label in ('Hidden Gems', 'Pet Friendly', 'Chill');

  insert into public.spots (name, category, price_range, city, province, address, description, hidden_gem, status, noise_level, music_style, lighting, seating_style)
  values ('Sonya''s Garden Cafe', 'restaurant', '₱₱₱', 'Tagaytay', 'Cavite', 'Barangay Buck Estate', 'A romantic garden restaurant serving organic farm-to-table set menus among flowering trellises.', false, 'approved', 'Quiet', 'Acoustic', 'Natural light', 'Garden seating')
  returning id into v_id;
  insert into public.spot_tags (spot_id, tag_id)
  select v_id, id from public.tags where label in ('Date Spot', 'PWD Friendly');
end $$;
