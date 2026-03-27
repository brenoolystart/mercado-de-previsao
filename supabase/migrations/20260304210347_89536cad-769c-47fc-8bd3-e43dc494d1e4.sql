-- Support both user wallet deposits and administrative gateway funding
ALTER TABLE public.pix_deposits
ADD COLUMN purpose text NOT NULL DEFAULT 'wallet';

ALTER TABLE public.pix_deposits
ADD COLUMN destination text NOT NULL DEFAULT 'wallet';

ALTER TABLE public.pix_deposits
ALTER COLUMN wallet_id DROP NOT NULL;

ALTER TABLE public.pix_deposits
ADD CONSTRAINT pix_deposits_purpose_check
CHECK (purpose IN ('wallet', 'gateway'));

ALTER TABLE public.pix_deposits
ADD CONSTRAINT pix_deposits_destination_check
CHECK (destination IN ('wallet', 'gateway'));

CREATE INDEX IF NOT EXISTS idx_pix_deposits_purpose_status
ON public.pix_deposits (purpose, status);

CREATE INDEX IF NOT EXISTS idx_pix_deposits_destination_status
ON public.pix_deposits (destination, status);