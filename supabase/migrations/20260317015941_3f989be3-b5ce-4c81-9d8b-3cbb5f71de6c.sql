
CREATE TABLE public.device_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fingerprint text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_fingerprints_fingerprint ON public.device_fingerprints(fingerprint);
CREATE INDEX idx_device_fingerprints_user_id ON public.device_fingerprints(user_id);
CREATE INDEX idx_device_fingerprints_ip ON public.device_fingerprints(ip_address);

CREATE TABLE public.signup_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_signup_rate_limits_ip ON public.signup_rate_limits(ip_address);
CREATE INDEX idx_signup_rate_limits_created ON public.signup_rate_limits(created_at);

CREATE TABLE public.abuse_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  flag_type text NOT NULL,
  details jsonb DEFAULT '{}',
  resolved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_abuse_flags_user ON public.abuse_flags(user_id);

ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fingerprints" ON public.device_fingerprints FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage rate limits" ON public.signup_rate_limits FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage abuse flags" ON public.abuse_flags FOR ALL TO authenticated USING (is_admin(auth.uid()));
