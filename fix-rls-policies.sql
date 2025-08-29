-- Fix infinite recursion in company_memberships RLS policy
-- Run this in Supabase SQL Editor to fix the authentication issue

-- Drop all existing policies on company_memberships
DROP POLICY IF EXISTS "Company members can read/write memberships" ON company_memberships;
DROP POLICY IF EXISTS "Users can manage company memberships" ON company_memberships;
DROP POLICY IF EXISTS "Allow user signup membership creation" ON company_memberships;

-- Create a new policy that allows users to manage their own memberships
-- and allows company owners to manage all memberships in their company
CREATE POLICY "Users can manage company memberships" ON company_memberships
FOR ALL USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM company_memberships owner_check 
    WHERE owner_check.company_id = company_memberships.company_id 
    AND owner_check.user_id = auth.uid() 
    AND owner_check.role = 'owner'
  )
);

-- Also create a separate policy for INSERT operations during signup
-- This allows new users to create their initial membership record
CREATE POLICY "Allow user signup membership creation" ON company_memberships
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
