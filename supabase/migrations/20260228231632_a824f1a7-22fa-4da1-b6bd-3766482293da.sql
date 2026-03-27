-- Allow anyone to read feature flags
CREATE POLICY "Anyone can read feature flags"
ON public.platform_settings
FOR SELECT
USING (key LIKE 'feature_%');
