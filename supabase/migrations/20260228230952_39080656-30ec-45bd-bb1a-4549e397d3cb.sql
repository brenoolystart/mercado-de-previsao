-- Allow anyone (including anonymous) to read maintenance_mode setting
CREATE POLICY "Anyone can read maintenance mode"
ON public.platform_settings
FOR SELECT
USING (key = 'maintenance_mode');
