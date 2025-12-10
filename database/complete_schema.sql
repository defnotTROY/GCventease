-- ============================================
-- GCventease Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    end_time TIME,
    location TEXT,
    is_virtual BOOLEAN DEFAULT false,
    virtual_link TEXT,
    max_participants INTEGER,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    image_url TEXT,
    category TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'pending', 'attended', 'cancelled', 'rejected', 'checked_in')),
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- ============================================
-- 3. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('event_update', 'registration', 'reminder', 'cancellation', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    action_url TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- ============================================
-- 4. PROFILES TABLE (Optional - for extended user info)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    department TEXT,
    year_level TEXT,
    student_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON public.participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Events Policies
-- Users can view all events
CREATE POLICY "Events are viewable by everyone" 
    ON public.events FOR SELECT 
    USING (true);

-- Users can create their own events
CREATE POLICY "Users can create their own events" 
    ON public.events FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update their own events" 
    ON public.events FOR UPDATE 
    USING (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete their own events" 
    ON public.events FOR DELETE 
    USING (auth.uid() = user_id);

-- Participants Policies
-- Users can view participants of events they created or are registered for
CREATE POLICY "Users can view participants" 
    ON public.participants FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR 
        auth.uid() IN (
            SELECT user_id FROM public.events WHERE id = event_id
        )
    );

-- Users can register for events
CREATE POLICY "Users can register for events" 
    ON public.participants FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Event creators can update participant status
CREATE POLICY "Event creators can update participants" 
    ON public.participants FOR UPDATE 
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.events WHERE id = event_id
        )
    );

-- Users can cancel their own registration
CREATE POLICY "Users can cancel their registration" 
    ON public.participants FOR UPDATE 
    USING (auth.uid() = user_id);

-- Event creators can delete participants
CREATE POLICY "Event creators can delete participants" 
    ON public.participants FOR DELETE 
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.events WHERE id = event_id
        )
    );

-- Notifications Policies
-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

-- System can create notifications for users
CREATE POLICY "System can create notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE 
    USING (auth.uid() = user_id);

-- Profiles Policies
-- Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

-- Users can create their own profile
CREATE POLICY "Users can create their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- ============================================
-- 7. DATABASE FUNCTIONS
-- ============================================

-- Function to get total user count from auth.users
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint FROM auth.users;
$$;

GRANT EXECUTE ON FUNCTION get_user_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_count() TO anon;

-- Function to update user role
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Update user metadata role
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(new_role)
  ),
  updated_at = NOW()
  WHERE id = user_id;

  -- Check if update was successful
  IF FOUND THEN
    SELECT json_build_object(
      'success', true,
      'message', 'User role updated successfully',
      'user_id', user_id,
      'new_role', new_role
    ) INTO result;
  ELSE
    SELECT json_build_object(
      'success', false,
      'message', 'User not found',
      'user_id', user_id
    ) INTO result;
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_role(UUID, TEXT) TO authenticated;

-- Function to update user status (active/inactive)
CREATE OR REPLACE FUNCTION update_user_status(user_id UUID, status TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  banned_until_value TIMESTAMPTZ;
BEGIN
  -- If status is 'suspended', ban user for 1 year
  -- If status is 'inactive', ban user indefinitely
  -- If status is 'active', remove ban
  CASE status
    WHEN 'suspended' THEN
      banned_until_value := NOW() + INTERVAL '1 year';
    WHEN 'inactive' THEN
      banned_until_value := '9999-12-31'::TIMESTAMPTZ;
    WHEN 'active' THEN
      banned_until_value := NULL;
    ELSE
      banned_until_value := NULL;
  END CASE;

  -- Update user ban status
  UPDATE auth.users
  SET banned_until = banned_until_value,
      updated_at = NOW()
  WHERE id = user_id;

  -- Check if update was successful
  IF FOUND THEN
    SELECT json_build_object(
      'success', true,
      'message', 'User status updated successfully',
      'user_id', user_id,
      'status', status
    ) INTO result;
  ELSE
    SELECT json_build_object(
      'success', false,
      'message', 'User not found',
      'user_id', user_id
    ) INTO result;
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_status(UUID, TEXT) TO authenticated;

-- Function to delete user (soft delete by banning)
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Soft delete by banning user indefinitely
  UPDATE auth.users
  SET banned_until = '9999-12-31'::TIMESTAMPTZ,
      updated_at = NOW()
  WHERE id = user_id;

  -- Check if update was successful
  IF FOUND THEN
    SELECT json_build_object(
      'success', true,
      'message', 'User deleted successfully (soft delete)',
      'user_id', user_id
    ) INTO result;
  ELSE
    SELECT json_build_object(
      'success', false,
      'message', 'User not found',
      'user_id', user_id
    ) INTO result;
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;

-- Function to get all users (for admin dashboard)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    banned_until TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'role', 'User') as role,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    banned_until
  FROM auth.users
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;

-- ============================================
-- 8. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for events table
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- You can now test the setup by running:
-- SELECT get_user_count();
-- SELECT * FROM get_all_users();
