
-- Allow admins (admin, developer, super_admin) to update platform_settings
CREATE POLICY "Admins can update settings"
ON public.platform_settings
FOR UPDATE
USING (is_admin(auth.uid()));
