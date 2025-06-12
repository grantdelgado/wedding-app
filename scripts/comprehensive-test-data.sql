-- Comprehensive Test Data for Unveil App
-- This script creates multiple test users, events, and guest relationships
-- so you can test both host and guest experiences

-- First, let's create some test users
-- Note: In production, these would be created through Supabase Auth
-- For testing, we'll insert them directly into the users table

-- Create test users
INSERT INTO public.users (
  id,
  email,
  full_name,
  phone,
  role,
  avatar_url
) VALUES 
  -- Main test users (these could be actual accounts you create)
  ('11111111-1111-1111-1111-111111111111', 'alice.smith@example.com', 'Alice Smith', '+1234567001', 'host', 'https://images.unsplash.com/photo-1494790108755-2616c2c01a1e?w=150'),
  ('22222222-2222-2222-2222-222222222222', 'bob.johnson@example.com', 'Bob Johnson', '+1234567002', 'host', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
  ('33333333-3333-3333-3333-333333333333', 'carol.davis@example.com', 'Carol Davis', '+1234567003', 'guest', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'),
  ('44444444-4444-4444-4444-444444444444', 'david.wilson@example.com', 'David Wilson', '+1234567004', 'guest', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
  ('55555555-5555-5555-5555-555555555555', 'emma.brown@example.com', 'Emma Brown', '+1234567005', 'host', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url;

-- Create test events with different hosts
INSERT INTO public.events (
  id,
  title,
  description,
  event_date,
  location,
  host_user_id,
  is_public,
  header_image_url
) VALUES 
  -- Alice's Wedding (you could be invited as a guest)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   'Alice & Michael''s Wedding', 
   'Join us for our special day filled with love, laughter, and celebration. We can''t wait to share this magical moment with our closest family and friends.',
   '2024-08-15 16:00:00+00',
   'Rosewood Manor, Napa Valley, California',
   '11111111-1111-1111-1111-111111111111',
   false,
   'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800'),
   
  -- Bob's Birthday Party (you could be invited as a guest)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
   'Bob''s 30th Birthday Bash', 
   'Let''s celebrate three decades of Bob! Come party with us for an unforgettable night of music, dancing, and great company.',
   '2024-07-20 19:00:00+00',
   'The Rooftop Bar, Downtown San Francisco',
   '22222222-2222-2222-2222-222222222222',
   true,
   'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800'),
   
  -- Emma's Baby Shower (you could be invited as a guest)
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 
   'Emma''s Baby Shower', 
   'Help us celebrate the upcoming arrival of Baby Brown! Join us for an afternoon of games, gifts, and sweet treats.',
   '2024-09-05 14:00:00+00',
   'Garden Pavilion, Golden Gate Park',
   '55555555-5555-5555-5555-555555555555',
   false,
   'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'),
   
  -- Sample event hosted by current user (you'll need to replace with your actual user ID)
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 
   'My Test Event', 
   'This is a test event that I''m hosting to test the host experience with guests.',
   '2024-08-01 18:00:00+00',
   'My Venue, My City',
   'YOUR_USER_ID_HERE', -- Replace with your actual user ID
   false,
   'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  event_date = EXCLUDED.event_date,
  location = EXCLUDED.location,
  host_user_id = EXCLUDED.host_user_id,
  is_public = EXCLUDED.is_public,
  header_image_url = EXCLUDED.header_image_url;

-- Create sub-events for Alice's Wedding
INSERT INTO public.sub_events (
  id,
  event_id,
  name,
  description,
  event_date,
  location,
  is_required,
  sort_order
) VALUES 
  ('sub1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rehearsal Dinner', 'Intimate dinner for the wedding party and immediate family', '2024-08-14 18:30:00+00', 'Vineyard Restaurant, Napa Valley', false, 1),
  ('sub2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Wedding Ceremony', 'The main wedding ceremony', '2024-08-15 16:00:00+00', 'Rosewood Manor Gardens', true, 2),
  ('sub3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Reception', 'Dinner, dancing, and celebration', '2024-08-15 18:00:00+00', 'Rosewood Manor Ballroom', true, 3),
  ('sub4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'After Party', 'Late night celebration for the party animals', '2024-08-15 22:00:00+00', 'The Wine Cellar', false, 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  event_date = EXCLUDED.event_date,
  location = EXCLUDED.location,
  is_required = EXCLUDED.is_required,
  sort_order = EXCLUDED.sort_order;

-- Create event guests for Alice's Wedding (including you as a potential guest)
INSERT INTO public.event_guests (
  id,
  event_id,
  guest_name,
  guest_email,
  phone,
  rsvp_status,
  user_id,
  guest_tags,
  notes,
  sms_opt_out,
  preferred_communication
) VALUES 
  -- You as a guest (replace with your phone/email)
  ('guest1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Your Name Here', 'your.email@example.com', '+YOUR_PHONE_HERE', 'pending', 'YOUR_USER_ID_HERE', ARRAY['friends', 'college'], 'College friend of the bride', false, 'sms'),
  
  -- Other test guests
  ('guest2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Carol Davis', 'carol.davis@example.com', '+1234567003', 'attending', '33333333-3333-3333-3333-333333333333', ARRAY['family', 'bride_side'], 'Sister of the bride', false, 'sms'),
  ('guest3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'David Wilson', 'david.wilson@example.com', '+1234567004', 'attending', '44444444-4444-4444-4444-444444444444', ARRAY['friends', 'groom_side'], 'Best friend of the groom', false, 'sms'),
  ('guest4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Jennifer Miller', 'jennifer.miller@example.com', '+1234567010', 'maybe', null, ARRAY['family', 'bride_side'], 'Aunt of the bride', false, 'sms'),
  ('guest5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Robert Taylor', 'robert.taylor@example.com', '+1234567011', 'declined', null, ARRAY['work', 'colleagues'], 'Work colleague', true, 'email'),
  ('guest6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lisa Anderson', 'lisa.anderson@example.com', '+1234567012', 'attending', null, ARRAY['friends', 'college'], 'College roommate', false, 'sms')
ON CONFLICT (id) DO UPDATE SET
  guest_name = EXCLUDED.guest_name,
  guest_email = EXCLUDED.guest_email,
  phone = EXCLUDED.phone,
  rsvp_status = EXCLUDED.rsvp_status,
  user_id = EXCLUDED.user_id,
  guest_tags = EXCLUDED.guest_tags,
  notes = EXCLUDED.notes,
  sms_opt_out = EXCLUDED.sms_opt_out,
  preferred_communication = EXCLUDED.preferred_communication;

-- Create guests for Bob's Birthday Party
INSERT INTO public.event_guests (
  id,
  event_id,
  guest_name,
  guest_email,
  phone,
  rsvp_status,
  user_id,
  guest_tags,
  notes
) VALUES 
  ('guest1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Your Name Here', 'your.email@example.com', '+YOUR_PHONE_HERE', 'attending', 'YOUR_USER_ID_HERE', ARRAY['close_friends'], 'Close friend from work'),
  ('guest2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Alice Smith', 'alice.smith@example.com', '+1234567001', 'attending', '11111111-1111-1111-1111-111111111111', ARRAY['close_friends'], 'Childhood friend'),
  ('guest3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Emma Brown', 'emma.brown@example.com', '+1234567005', 'maybe', '55555555-5555-5555-5555-555555555555', ARRAY['work_friends'], 'Coworker'),
  ('guest4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mike Thompson', 'mike.thompson@example.com', '+1234567020', 'pending', null, ARRAY['gym_buddies'], 'Gym workout partner')
ON CONFLICT (id) DO UPDATE SET
  guest_name = EXCLUDED.guest_name,
  guest_email = EXCLUDED.guest_email,
  phone = EXCLUDED.phone,
  rsvp_status = EXCLUDED.rsvp_status,
  user_id = EXCLUDED.user_id,
  guest_tags = EXCLUDED.guest_tags,
  notes = EXCLUDED.notes;

-- Create guests for your own test event (so you can test host experience)
INSERT INTO public.event_guests (
  id,
  event_id,
  guest_name,
  guest_email,
  phone,
  rsvp_status,
  user_id,
  guest_tags,
  notes
) VALUES 
  ('guest1-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Alice Smith', 'alice.smith@example.com', '+1234567001', 'attending', '11111111-1111-1111-1111-111111111111', ARRAY['vip', 'close_friends'], 'Close friend and fellow host'),
  ('guest2-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Bob Johnson', 'bob.johnson@example.com', '+1234567002', 'maybe', '22222222-2222-2222-2222-222222222222', ARRAY['friends'], 'Friend from the birthday party'),
  ('guest3-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test Guest Without Account', 'test.guest@example.com', '+1234567030', 'pending', null, ARRAY['acquaintances'], 'Someone without an app account'),
  ('guest4-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Sarah Williams', 'sarah.williams@example.com', '+1234567031', 'declined', null, ARRAY['work'], 'Work contact who declined')
ON CONFLICT (id) DO UPDATE SET
  guest_name = EXCLUDED.guest_name,
  guest_email = EXCLUDED.guest_email,
  phone = EXCLUDED.phone,
  rsvp_status = EXCLUDED.rsvp_status,
  user_id = EXCLUDED.user_id,
  guest_tags = EXCLUDED.guest_tags,
  notes = EXCLUDED.notes;

-- Create some sample messages for Alice's Wedding
INSERT INTO public.messages (
  id,
  event_id,
  sender_user_id,
  content,
  message_type,
  recipient_tags
) VALUES 
  ('msg1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Welcome to our wedding celebration! We''re so excited to share this special day with all of you. Please don''t hesitate to reach out if you have any questions.', 'announcement', ARRAY['all']),
  ('msg2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Can''t wait for the big day! Is there anything I can help with for setup?', 'channel', ARRAY['family']),
  ('msg3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Thanks Carol! We''ll have a setup crew, but your offer means the world to us. Just come ready to celebrate! 💕', 'channel', ARRAY['family'])
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  message_type = EXCLUDED.message_type,
  recipient_tags = EXCLUDED.recipient_tags;

-- Create some sample media for the events
INSERT INTO public.media (
  id,
  event_id,
  storage_path,
  media_type,
  caption,
  uploader_user_id,
  is_featured,
  media_tags
) VALUES 
  ('media1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test-media/wedding-venue-1.jpg', 'image', 'Beautiful view of our wedding venue!', '11111111-1111-1111-1111-111111111111', true, ARRAY['venue', 'ceremony']),
  ('media2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test-media/wedding-flowers.jpg', 'image', 'Sneak peek at our floral arrangements 🌸', '11111111-1111-1111-1111-111111111111', false, ARRAY['decorations', 'flowers']),
  ('media3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'test-media/birthday-setup.jpg', 'image', 'Party setup is looking amazing!', '22222222-2222-2222-2222-222222222222', true, ARRAY['setup', 'decorations'])
ON CONFLICT (id) DO UPDATE SET
  caption = EXCLUDED.caption,
  is_featured = EXCLUDED.is_featured,
  media_tags = EXCLUDED.media_tags;

-- Create guest assignments for sub-events (Alice's Wedding)
INSERT INTO public.guest_sub_event_assignments (
  guest_id,
  sub_event_id,
  is_invited,
  rsvp_status
) VALUES 
  -- Your assignments to sub-events
  ('guest1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'attending'), -- Wedding Ceremony
  ('guest1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'attending'), -- Reception
  ('guest1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'maybe'), -- After Party
  
  -- Carol (family) gets invited to everything
  ('guest2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'attending'), -- Rehearsal Dinner
  ('guest2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'attending'), -- Wedding Ceremony
  ('guest2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'attending'), -- Reception
  ('guest2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'attending'), -- After Party
  
  -- David (best friend of groom) gets invited to everything
  ('guest3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'attending'), -- Rehearsal Dinner
  ('guest3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'attending'), -- Wedding Ceremony
  ('guest3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'attending'), -- Reception
  ('guest3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sub4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'attending') -- After Party
ON CONFLICT (guest_id, sub_event_id) DO UPDATE SET
  is_invited = EXCLUDED.is_invited,
  rsvp_status = EXCLUDED.rsvp_status;

-- Create some communication preferences
INSERT INTO public.communication_preferences (
  user_id,
  event_id,
  receive_sms,
  receive_push,
  receive_email,
  timezone
) VALUES 
  ('YOUR_USER_ID_HERE', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, true, false, 'America/Los_Angeles'),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, true, true, 'America/New_York'),
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, false, false, 'America/Chicago')
ON CONFLICT (user_id, event_id) DO UPDATE SET
  receive_sms = EXCLUDED.receive_sms,
  receive_push = EXCLUDED.receive_push,
  receive_email = EXCLUDED.receive_email,
  timezone = EXCLUDED.timezone;

-- Display summary of what was created
DO $$
BEGIN
  RAISE NOTICE '=== Test Data Creation Complete ===';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '- 5 test users (Alice, Bob, Carol, David, Emma)';
  RAISE NOTICE '- 4 test events (Alice''s Wedding, Bob''s Birthday, Emma''s Baby Shower, Your Test Event)';
  RAISE NOTICE '- 4 sub-events for Alice''s Wedding (Rehearsal, Ceremony, Reception, After Party)';
  RAISE NOTICE '- Multiple event guests with different RSVP statuses';
  RAISE NOTICE '- Sample messages and media';
  RAISE NOTICE '- Guest sub-event assignments';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Replace the following placeholders with your actual values:';
  RAISE NOTICE '   - YOUR_USER_ID_HERE: Your actual user ID from Supabase Auth';
  RAISE NOTICE '   - Your Name Here: Your actual name';
  RAISE NOTICE '   - your.email@example.com: Your actual email';
  RAISE NOTICE '   - +YOUR_PHONE_HERE: Your actual phone number';
  RAISE NOTICE '';
  RAISE NOTICE 'After updating the placeholders, you can:';
  RAISE NOTICE '1. Test being a GUEST by viewing Alice''s Wedding, Bob''s Birthday, etc.';
  RAISE NOTICE '2. Test being a HOST by managing "My Test Event" with its guests';
  RAISE NOTICE '3. Test messaging, media uploads, RSVP changes, and more!';
END $$; 