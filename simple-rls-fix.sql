-- Simple RLS policy fix - run this in Supabase SQL Editor
-- This removes the problematic recursive policy

DROP POLICY IF EXISTS "Company members can read/write memberships" ON company_memberships;

-- Complete RLS fix for Bhavishya Road Carriers
-- This fixes the 400 status errors by disabling RLS and removing all policies

-- Drop all existing policies first
DROP POLICY IF EXISTS "Authenticated users can access companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can access bills" ON bills;
DROP POLICY IF EXISTS "Authenticated users can access memos" ON memos;
DROP POLICY IF EXISTS "Authenticated users can access loading_slips" ON loading_slips;
DROP POLICY IF EXISTS "Authenticated users can access parties" ON parties;
DROP POLICY IF EXISTS "Authenticated users can access suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can access vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can access company_memberships" ON company_memberships;

-- Disable RLS completely on all tables
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE memos DISABLE ROW LEVEL SECURITY;
ALTER TABLE loading_slips DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships DISABLE ROW LEVEL SECURITY;
