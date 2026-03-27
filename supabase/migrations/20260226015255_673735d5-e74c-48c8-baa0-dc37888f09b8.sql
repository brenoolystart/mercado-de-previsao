
-- Drop the overly permissive policy
DROP POLICY "Service can update deposits" ON public.pix_deposits;

-- Admins can also update deposits
CREATE POLICY "Admins can update deposits"
ON public.pix_deposits
FOR UPDATE
USING (is_admin(auth.uid()));
