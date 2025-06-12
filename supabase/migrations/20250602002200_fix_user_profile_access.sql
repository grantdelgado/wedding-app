-- Migration to fix user profile access for event participants
-- This allows guests to view host profiles and event-related user information

-- Add policy for guests to view host profiles
CREATE POLICY "Event participants can view host profiles"
ON public.users FOR SELECT TO authenticated
USING (
  -- Users can view their own profile (existing behavior)
  id = auth.uid()
  OR
  -- Event guests can view host profiles
  EXISTS (
    SELECT 1 FROM public.events
    WHERE host_user_id = users.id 
    AND (public.is_event_guest(events.id) OR public.is_event_host(events.id))
  )
  OR
  -- Event hosts can view guest profiles
  EXISTS (
    SELECT 1 FROM public.event_guests eg
    JOIN public.events e ON eg.event_id = e.id
    WHERE eg.user_id = users.id 
    AND public.is_event_host(e.id)
  )
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Also create a policy for the public_user_profiles view
-- (Views inherit RLS from their underlying tables, but we can add explicit policies)
ALTER VIEW public.public_user_profiles SET (security_barrier = true);

-- Create a function to check if a user profile can be viewed
CREATE OR REPLACE FUNCTION can_view_user_profile(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- Users can view their own profile
    target_user_id = auth.uid()
    OR
    -- Event guests can view host profiles
    EXISTS (
      SELECT 1 FROM public.events
      WHERE host_user_id = target_user_id 
      AND (public.is_event_guest(events.id) OR public.is_event_host(events.id))
    )
    OR
    -- Event hosts can view guest profiles
    EXISTS (
      SELECT 1 FROM public.event_guests eg
      JOIN public.events e ON eg.event_id = e.id
      WHERE eg.user_id = target_user_id 
      AND public.is_event_host(e.id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 