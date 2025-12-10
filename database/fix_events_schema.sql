-- Add end_time column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_time TIME;

-- Optional: Update existing records to have a default end time (e.g. 2 hours after start time) if needed, 
-- but for now we just add the column to allow inserts to work.
