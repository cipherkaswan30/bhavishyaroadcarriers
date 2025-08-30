-- Fix RLS Permission Issues for Bhavishya Road Carriers
-- Run this in Supabase SQL Editor to allow authenticated users access

-- Drop existing restrictive policies that are causing 404 errors
DROP POLICY IF EXISTS "Company members can read/write companies" ON companies;
DROP POLICY IF EXISTS "Company members can read/write bills" ON bills;
DROP POLICY IF EXISTS "Company members can read/write memos" ON memos;
DROP POLICY IF EXISTS "Company members can read/write loading_slips" ON loading_slips;
DROP POLICY IF EXISTS "Company members can read/write parties" ON parties;
DROP POLICY IF EXISTS "Company members can read/write suppliers" ON suppliers;
DROP POLICY IF EXISTS "Company members can read/write vehicles" ON vehicles;
DROP POLICY IF EXISTS "Company members can read/write company_memberships" ON company_memberships;

-- Create simple policies that allow any authenticated user access
CREATE POLICY "Authenticated users can access companies" ON companies 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access bills" ON bills 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access memos" ON memos 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access loading_slips" ON loading_slips 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access parties" ON parties 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access suppliers" ON suppliers 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access vehicles" ON vehicles 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access company_memberships" ON company_memberships 
FOR ALL USING (auth.uid() IS NOT NULL);
