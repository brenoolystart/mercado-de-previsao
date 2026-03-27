
-- Add demo mode fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN demo_mode_active boolean NOT NULL DEFAULT false,
ADD COLUMN demo_started_at timestamp with time zone,
ADD COLUMN demo_balance numeric NOT NULL DEFAULT 0;
