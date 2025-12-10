-- Fix infinite recursion in participants policy
DROP POLICY IF EXISTS "Users can view participants" ON public.participants;

CREATE POLICY "Users can view participants" 
    ON public.participants FOR SELECT 
    USING (
        -- User views their own participation
        auth.uid() = user_id 
        OR 
        -- User views participants of events they created
        auth.uid() IN (
            SELECT user_id FROM public.events WHERE id = event_id
        )
    );
