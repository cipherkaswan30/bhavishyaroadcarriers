-- Simple RLS policy fix - run this in Supabase SQL Editor
-- This removes the problematic recursive policy

DROP POLICY IF EXISTS "Company members can read/write memberships" ON company_memberships;

-- Create a simple policy that allows users to insert their own membership
CREATE POLICY "Users can insert own membership" ON company_memberships
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create a policy that allows users to read memberships where they are a member
CREATE POLICY "Users can read own memberships" ON company_memberships
FOR SELECT USING (user_id = auth.uid());
