-- ============================================================
-- CoinDebrief — Phase 3 Schema Additions
-- Run this AFTER the Phase 2 schema in your Supabase SQL Editor
-- ============================================================

-- 20. Admin RLS Policies (allow admins to read all data)
-- This checks if the current user has role='admin' in profiles

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Admin can read all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.is_admin());

-- Admin can read all leads
CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (public.is_admin());
