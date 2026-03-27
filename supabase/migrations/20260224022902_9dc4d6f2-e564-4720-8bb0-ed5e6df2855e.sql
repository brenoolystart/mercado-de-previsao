
-- Create a security definer function to check roles without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a function to check if user is any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'moderator')
  )
$$;

-- Create a function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Recreate user_roles policies WITHOUT referencing user_roles itself
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Fix wallets policies that reference user_roles
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets"
ON public.wallets FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix bets policies that reference user_roles
DROP POLICY IF EXISTS "Admins can view all bets" ON public.bets;
CREATE POLICY "Admins can view all bets"
ON public.bets FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix admin_audit_log policies
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;

CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Fix gateway_config policies
DROP POLICY IF EXISTS "Super admins can manage gateway" ON public.gateway_config;
CREATE POLICY "Super admins can manage gateway"
ON public.gateway_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Fix platform_settings policies
DROP POLICY IF EXISTS "Admins can view settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Super admins can manage settings" ON public.platform_settings;

CREATE POLICY "Admins can view settings"
ON public.platform_settings FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage settings"
ON public.platform_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));
