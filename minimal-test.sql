-- Minimal database test - create simple table to test if database works at all
-- Run this in Supabase SQL Editor

-- Drop existing complex tables that might be causing issues
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS memos CASCADE;
DROP TABLE IF EXISTS loading_slips CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Create simple test table
CREATE TABLE simple_test (
  id SERIAL PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert test data
INSERT INTO simple_test (name) VALUES ('Test Entry 1'), ('Test Entry 2');

-- Check if data exists
SELECT * FROM simple_test;
