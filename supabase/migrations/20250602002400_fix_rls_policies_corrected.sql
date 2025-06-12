-- Corrected RLS Policy Fix Migration
-- This migration fixes all permission issues for event participants

-- First, drop any existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Event participants can view host profiles" ON public.users;
DROP POLICY IF EXISTS "Event participants can view related profiles" ON public.users;
DROP POLICY IF EXISTS "User profile access policy" ON public.users;

-- Create a helper function for RLS checks
CREATE OR REPLACE FUNCTION public.user_can_view_profile(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user can view the target user's profile
  RETURN (
    -- Own profile
    target_user_id = auth.uid()
    OR
    -- Target is host of events where current user is guest
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.event_guests eg ON eg.event_id = e.id
      WHERE e.host_user_id = target_user_id AND eg.user_id = auth.uid()
    )
    OR
    -- Current user is host of events where target is guest
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.event_guests eg ON eg.event_id = e.id
      WHERE e.host_user_id = auth.uid() AND eg.user_id = target_user_id
    )
    OR
    -- Both users are guests in the same event
    EXISTS (
      SELECT 1 FROM public.event_guests eg1
      JOIN public.event_guests eg2 ON eg1.event_id = eg2.event_id
      WHERE eg1.user_id = auth.uid() AND eg2.user_id = target_user_id
    )
    OR
    -- Target is sender of messages in events where current user participates
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.events e ON m.event_id = e.id
      LEFT JOIN public.event_guests eg ON eg.event_id = e.id AND eg.user_id = auth.uid()
      WHERE m.sender_user_id = target_user_id 
      AND (e.host_user_id = auth.uid() OR eg.user_id IS NOT NULL)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new RLS policy
CREATE POLICY "Event participants can view related user profiles"
ON public.users FOR SELECT TO authenticated
USING (public.user_can_view_profile(id));

-- Drop and recreate the public_user_profiles view with security
DROP VIEW IF EXISTS public.public_user_profiles;

CREATE VIEW public.public_user_profiles AS
SELECT 
  u.id,
  u.full_name,
  u.avatar_url
FROM public.users u
WHERE public.user_can_view_profile(u.id);

-- Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.public_user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_view_profile(UUID) TO authenticated;

-- Comment for debugging
COMMENT ON FUNCTION public.user_can_view_profile(UUID) IS 'Function to check if current user can view target user profile based on event participation'; 