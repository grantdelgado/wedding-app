--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: media_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.media_type_enum AS ENUM (
    'image',
    'video'
);


--
-- Name: message_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_type_enum AS ENUM (
    'direct',
    'announcement',
    'channel'
);


--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role_enum AS ENUM (
    'guest',
    'host',
    'admin'
);


--
-- Name: current_user_guest_has_tags(uuid, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_guest_has_tags(p_event_id uuid, p_tags_to_check text[]) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF p_tags_to_check IS NULL OR array_length(p_tags_to_check, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.event_guests
    WHERE event_id = p_event_id
      AND user_id = auth.uid()
      AND guest_tags && p_tags_to_check
  );
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;


--
-- Name: handle_user_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_user_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.users
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: is_event_guest(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_event_guest(p_event_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.event_guests
    WHERE event_id = p_event_id AND user_id = auth.uid()
  );
END;
$$;


--
-- Name: is_event_host(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_event_host(p_event_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.events
    WHERE id = p_event_id AND host_user_id = auth.uid()
  );
END;
$$;


--
-- Name: is_going_guest(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_going_guest(eid uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_guests
    WHERE event_id = eid
      AND user_id = auth.uid()
      AND rsvp_status = 'going'
  );
$$;


--
-- Name: is_user_guest_of_event(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_guest_of_event(p_event_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.event_guests eg
    WHERE eg.event_id = p_event_id AND eg.user_id = p_user_id
  );
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: event_guests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_guests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid,
    rsvp_status text,
    guest_tags text[],
    phone text,
    notes text,
    guest_name text,
    guest_email text,
    CONSTRAINT event_guests_rsvp_status_check CHECK ((rsvp_status = ANY (ARRAY['Attending'::text, 'Declined'::text, 'Maybe'::text, 'Pending'::text])))
);


--
-- Name: TABLE event_guests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.event_guests IS 'Guest metadata and RSVP details.';


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    host_user_id uuid NOT NULL,
    title text NOT NULL,
    event_date date NOT NULL,
    location text,
    header_image_url text,
    description text,
    is_public boolean DEFAULT true
);


--
-- Name: TABLE events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.events IS 'Wedding or event metadata.';


--
-- Name: media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_id uuid NOT NULL,
    uploader_user_id uuid,
    media_type text NOT NULL,
    storage_path text NOT NULL,
    caption text,
    is_featured boolean DEFAULT false,
    media_tags text[],
    CONSTRAINT media_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text, 'audio'::text])))
);


--
-- Name: TABLE media; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.media IS 'Media uploads for events.';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_id uuid NOT NULL,
    sender_user_id uuid,
    recipient_user_id uuid,
    recipient_tags text[],
    content text NOT NULL,
    message_type text DEFAULT 'direct'::text NOT NULL,
    parent_message_id uuid,
    CONSTRAINT messages_message_type_check CHECK ((message_type = ANY (ARRAY['direct'::text, 'broadcast'::text, 'reply'::text])))
);


--
-- Name: TABLE messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.messages IS 'Messages sent within events.';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name text,
    email text NOT NULL,
    avatar_url text,
    role text DEFAULT 'guest'::text,
    CONSTRAINT email_format CHECK ((email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]+$'::text))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'Public user profiles extending Supabase auth.users.';


--
-- Name: COLUMN users.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.id IS 'UUID that matches auth.users.id';


--
-- Name: public_user_profiles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_user_profiles AS
 SELECT users.id,
    users.full_name,
    users.avatar_url
   FROM public.users;


--
-- Name: event_guests event_guests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_guests
    ADD CONSTRAINT event_guests_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: users unique_user_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_user_email UNIQUE (email);


--
-- Name: event_guests uq_event_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_guests
    ADD CONSTRAINT uq_event_user UNIQUE (event_id, user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: event_guests handle_updated_at_event_guests; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at_event_guests BEFORE UPDATE ON public.event_guests FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');


--
-- Name: events handle_updated_at_events; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at_events BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');


--
-- Name: media handle_updated_at_media; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at_media BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');


--
-- Name: messages handle_updated_at_messages; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at_messages BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');


--
-- Name: users handle_updated_at_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');


--
-- Name: event_guests event_guests_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_guests
    ADD CONSTRAINT event_guests_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_guests event_guests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_guests
    ADD CONSTRAINT event_guests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: events events_host_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_host_user_id_fkey FOREIGN KEY (host_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: media media_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: media media_uploader_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_uploader_user_id_fkey FOREIGN KEY (uploader_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: messages messages_parent_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_parent_message_id_fkey FOREIGN KEY (parent_message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: messages messages_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);


--
-- Name: events Authenticated users can create events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT TO authenticated WITH CHECK ((host_user_id = auth.uid()));


--
-- Name: event_guests Event hosts can add guests to their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can add guests to their events" ON public.event_guests FOR INSERT TO authenticated WITH CHECK (public.is_event_host(event_id));


--
-- Name: media Event hosts can delete media in their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can delete media in their events" ON public.media FOR DELETE TO authenticated USING (public.is_event_host(event_id));


--
-- Name: messages Event hosts can delete messages in their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can delete messages in their events" ON public.messages FOR DELETE TO authenticated USING (public.is_event_host(event_id));


--
-- Name: events Event hosts can delete their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can delete their own events" ON public.events FOR DELETE TO authenticated USING ((host_user_id = auth.uid()));


--
-- Name: event_guests Event hosts can remove guests from their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can remove guests from their events" ON public.event_guests FOR DELETE TO authenticated USING (public.is_event_host(event_id));


--
-- Name: event_guests Event hosts can update guest entries for their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can update guest entries for their events" ON public.event_guests FOR UPDATE TO authenticated USING (public.is_event_host(event_id)) WITH CHECK (public.is_event_host(event_id));


--
-- Name: media Event hosts can update media in their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can update media in their events" ON public.media FOR UPDATE TO authenticated USING (public.is_event_host(event_id)) WITH CHECK (public.is_event_host(event_id));


--
-- Name: events Event hosts can update their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can update their own events" ON public.events FOR UPDATE TO authenticated USING ((host_user_id = auth.uid())) WITH CHECK ((host_user_id = auth.uid()));


--
-- Name: media Event hosts can upload media to their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can upload media to their events" ON public.media FOR INSERT TO authenticated WITH CHECK ((((uploader_user_id = auth.uid()) OR (uploader_user_id IS NULL)) AND public.is_event_host(event_id)));


--
-- Name: messages Event hosts can view all messages in their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can view all messages in their events" ON public.messages FOR SELECT TO authenticated USING (public.is_event_host(event_id));


--
-- Name: event_guests Event hosts can view guests for their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can view guests for their events" ON public.event_guests FOR SELECT TO authenticated USING (public.is_event_host(event_id));


--
-- Name: media Event participants can view event media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event participants can view event media" ON public.media FOR SELECT TO authenticated USING ((public.is_event_guest(event_id) OR public.is_event_host(event_id)));


--
-- Name: event_guests Guests can add themselves to an event; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guests can add themselves to an event" ON public.event_guests FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: event_guests Guests can delete their own guest entry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guests can delete their own guest entry" ON public.event_guests FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: messages Guests can send messages in their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guests can send messages in their events" ON public.messages FOR INSERT TO authenticated WITH CHECK (((sender_user_id = auth.uid()) AND (public.is_event_guest(event_id) OR public.is_event_host(event_id))));


--
-- Name: event_guests Guests can update their own guest entry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guests can update their own guest entry" ON public.event_guests FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: media Guests can upload media to their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guests can upload media to their events" ON public.media FOR INSERT TO authenticated WITH CHECK (((uploader_user_id = auth.uid()) AND public.is_event_guest(event_id)));


--
-- Name: event_guests Guests can view their own guest entry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guests can view their own guest entry" ON public.event_guests FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: messages Senders can delete their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Senders can delete their own messages" ON public.messages FOR DELETE TO authenticated USING ((sender_user_id = auth.uid()));


--
-- Name: media Uploaders can delete their own media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Uploaders can delete their own media" ON public.media FOR DELETE TO authenticated USING ((uploader_user_id = auth.uid()));


--
-- Name: media Uploaders can update their own media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Uploaders can update their own media" ON public.media FOR UPDATE TO authenticated USING ((uploader_user_id = auth.uid())) WITH CHECK ((uploader_user_id = auth.uid()));


--
-- Name: users Users can delete their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own profile" ON public.users FOR DELETE TO authenticated USING ((id = auth.uid()));


--
-- Name: users Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: events Users can view events they are invited to or public ones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view events they are invited to or public ones" ON public.events FOR SELECT TO authenticated USING (((is_public = true) OR public.is_event_guest(id) OR public.is_event_host(id)));


--
-- Name: messages Users can view relevant messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view relevant messages" ON public.messages FOR SELECT TO authenticated USING (((sender_user_id = auth.uid()) OR (recipient_user_id = auth.uid()) OR (public.is_event_guest(event_id) AND (((recipient_user_id IS NULL) AND (recipient_tags IS NULL)) OR ((recipient_user_id IS NULL) AND (recipient_tags IS NOT NULL) AND public.current_user_guest_has_tags(event_id, recipient_tags))))));


--
-- Name: users Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT TO authenticated USING ((id = auth.uid()));


--
-- Name: event_guests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_guests ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

