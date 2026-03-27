
-- Add banned status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason text;

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
  ON public.announcements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  USING (is_admin(auth.uid()));

-- Create promo_bonuses table
CREATE TABLE IF NOT EXISTS public.promo_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  percentage numeric,
  max_uses integer NOT NULL DEFAULT 100,
  used_count integer NOT NULL DEFAULT 0,
  min_deposit numeric DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

ALTER TABLE public.promo_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bonuses"
  ON public.promo_bonuses FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active bonuses"
  ON public.promo_bonuses FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

-- Create bonus_redemptions table to track usage
CREATE TABLE IF NOT EXISTS public.bonus_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bonus_id uuid NOT NULL REFERENCES public.promo_bonuses(id),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(bonus_id, user_id)
);

ALTER TABLE public.bonus_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON public.bonus_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions"
  ON public.bonus_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions"
  ON public.bonus_redemptions FOR SELECT
  USING (is_admin(auth.uid()));
