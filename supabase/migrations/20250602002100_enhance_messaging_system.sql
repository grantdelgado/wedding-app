-- Enhancement for messaging system to support host dashboard requirements
-- Add sub-events, scheduled messaging, and SMS communication

-- 1. Create sub_events table for event-specific tagging (Rehearsal Dinner, Ceremony, etc.)
CREATE TABLE IF NOT EXISTS public.sub_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_required BOOLEAN DEFAULT false, -- Some events might be optional (rehearsal dinner)
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create junction table for guest-to-sub-event assignments
CREATE TABLE IF NOT EXISTS public.guest_sub_event_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL REFERENCES public.event_guests(id) ON DELETE CASCADE,
  sub_event_id UUID NOT NULL REFERENCES public.sub_events(id) ON DELETE CASCADE,
  is_invited BOOLEAN DEFAULT true,
  rsvp_status VARCHAR(20) DEFAULT 'pending' CHECK (rsvp_status IN ('attending', 'declined', 'maybe', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guest_id, sub_event_id)
);

-- 3. Create scheduled_messages table for message scheduling
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject VARCHAR(500),
  content TEXT NOT NULL,
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Targeting options
  target_all_guests BOOLEAN DEFAULT false,
  target_sub_event_ids UUID[], -- Array of sub_event IDs
  target_guest_tags TEXT[], -- Array of guest tags
  target_guest_ids UUID[], -- Specific guest IDs
  
  -- Message delivery settings
  send_via_sms BOOLEAN DEFAULT true,
  send_via_push BOOLEAN DEFAULT true,
  send_via_email BOOLEAN DEFAULT false,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create message_deliveries table to track individual message delivery
CREATE TABLE IF NOT EXISTS public.message_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_message_id UUID REFERENCES public.scheduled_messages(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL, -- Link to actual sent message
  guest_id UUID NOT NULL REFERENCES public.event_guests(id) ON DELETE CASCADE,
  
  -- Delivery channels
  phone_number VARCHAR(20),
  email VARCHAR(255),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- If guest has app account
  
  -- Delivery status per channel
  sms_status VARCHAR(20) DEFAULT 'pending' CHECK (sms_status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')),
  push_status VARCHAR(20) DEFAULT 'pending' CHECK (push_status IN ('pending', 'sent', 'delivered', 'failed', 'not_applicable')),
  email_status VARCHAR(20) DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'delivered', 'failed', 'not_applicable')),
  
  -- External service tracking
  sms_provider_id VARCHAR(255), -- Twilio message SID
  push_provider_id VARCHAR(255),
  email_provider_id VARCHAR(255),
  
  -- Response tracking
  has_responded BOOLEAN DEFAULT false,
  response_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add SMS preferences to event_guests table
ALTER TABLE public.event_guests 
ADD COLUMN IF NOT EXISTS phone_number_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_communication VARCHAR(20) DEFAULT 'sms' CHECK (preferred_communication IN ('sms', 'push', 'email', 'none'));

-- 6. Create communication_preferences table for app users
CREATE TABLE IF NOT EXISTS public.communication_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Preferences
  receive_sms BOOLEAN DEFAULT true,
  receive_push BOOLEAN DEFAULT true,
  receive_email BOOLEAN DEFAULT false,
  
  -- Time preferences
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- 7. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sub_events_event_id ON public.sub_events(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_sub_event_assignments_guest_id ON public.guest_sub_event_assignments(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_sub_event_assignments_sub_event_id ON public.guest_sub_event_assignments(sub_event_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_event_id ON public.scheduled_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_send_at ON public.scheduled_messages(send_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON public.scheduled_messages(status);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_scheduled_message_id ON public.message_deliveries(scheduled_message_id);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_guest_id ON public.message_deliveries(guest_id);
CREATE INDEX IF NOT EXISTS idx_communication_preferences_user_event ON public.communication_preferences(user_id, event_id);

-- 8. Row Level Security (RLS) Policies

-- Sub-events policies
ALTER TABLE public.sub_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sub-events for events they host or are guests of"
ON public.sub_events FOR SELECT
USING (
  is_event_host(event_id) OR 
  is_event_guest(event_id)
);

CREATE POLICY "Only event hosts can manage sub-events"
ON public.sub_events FOR ALL
USING (is_event_host(event_id))
WITH CHECK (is_event_host(event_id));

-- Guest sub-event assignments policies
ALTER TABLE public.guest_sub_event_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignments for events they host or are guests of"
ON public.guest_sub_event_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sub_events se 
    WHERE se.id = sub_event_id AND (is_event_host(se.event_id) OR is_event_guest(se.event_id))
  )
);

CREATE POLICY "Only event hosts can manage guest assignments"
ON public.guest_sub_event_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.sub_events se 
    WHERE se.id = sub_event_id AND is_event_host(se.event_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sub_events se 
    WHERE se.id = sub_event_id AND is_event_host(se.event_id)
  )
);

-- Scheduled messages policies
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only event hosts can manage scheduled messages"
ON public.scheduled_messages FOR ALL
USING (is_event_host(event_id))
WITH CHECK (is_event_host(event_id));

-- Message deliveries policies
ALTER TABLE public.message_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deliveries for events they host"
ON public.message_deliveries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.scheduled_messages sm 
    WHERE sm.id = scheduled_message_id AND is_event_host(sm.event_id)
  )
);

CREATE POLICY "Only event hosts can manage message deliveries"
ON public.message_deliveries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.scheduled_messages sm 
    WHERE sm.id = scheduled_message_id AND is_event_host(sm.event_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scheduled_messages sm 
    WHERE sm.id = scheduled_message_id AND is_event_host(sm.event_id)
  )
);

-- Communication preferences policies
ALTER TABLE public.communication_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own communication preferences"
ON public.communication_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Event hosts can view guest communication preferences"
ON public.communication_preferences FOR SELECT
USING (is_event_host(event_id));

-- 9. Create helpful functions

-- Function to get all guests for a sub-event
CREATE OR REPLACE FUNCTION get_sub_event_guests(p_sub_event_id UUID)
RETURNS TABLE (
  guest_id UUID,
  guest_name TEXT,
  guest_email TEXT,
  phone_number TEXT,
  rsvp_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eg.id,
    eg.guest_name,
    eg.guest_email,
    eg.phone,
    gsea.rsvp_status
  FROM public.event_guests eg
  INNER JOIN public.guest_sub_event_assignments gsea ON eg.id = gsea.guest_id
  WHERE gsea.sub_event_id = p_sub_event_id
  AND gsea.is_invited = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a scheduled message should be sent
CREATE OR REPLACE FUNCTION get_ready_scheduled_messages()
RETURNS TABLE (
  id UUID,
  event_id UUID,
  content TEXT,
  target_guest_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.event_id,
    sm.content,
    CASE 
      WHEN sm.target_all_guests THEN (
        SELECT COUNT(*) FROM public.event_guests eg WHERE eg.event_id = sm.event_id
      )
      ELSE (
        SELECT COUNT(DISTINCT eg.id) 
        FROM public.event_guests eg
        LEFT JOIN public.guest_sub_event_assignments gsea ON eg.id = gsea.guest_id
        LEFT JOIN public.sub_events se ON gsea.sub_event_id = se.id
        WHERE eg.event_id = sm.event_id
        AND (
          sm.target_guest_ids IS NULL OR eg.id = ANY(sm.target_guest_ids) OR
          sm.target_guest_tags IS NULL OR sm.target_guest_tags && eg.guest_tags OR
          sm.target_sub_event_ids IS NULL OR se.id = ANY(sm.target_sub_event_ids)
        )
      )
    END as target_guest_count
  FROM public.scheduled_messages sm
  WHERE sm.status = 'scheduled'
  AND sm.send_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 