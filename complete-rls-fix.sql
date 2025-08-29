-- Complete RLS policy fix to resolve infinite recursion
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies on company_memberships to start fresh
DROP POLICY IF EXISTS "Company members can read/write memberships" ON company_memberships;
DROP POLICY IF EXISTS "Users can manage company memberships" ON company_memberships;
DROP POLICY IF EXISTS "Allow user signup membership creation" ON company_memberships;
DROP POLICY IF EXISTS "Users can insert own membership" ON company_memberships;
DROP POLICY IF EXISTS "Users can read own memberships" ON company_memberships;

-- Temporarily disable RLS to allow operations
ALTER TABLE company_memberships DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Allow authenticated users to insert memberships" ON company_memberships
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow users to read their own memberships" ON company_memberships
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow users to update their own memberships" ON company_memberships
FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON company_memberships TO authenticated;
