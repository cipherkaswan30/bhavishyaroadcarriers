-- Disable the database trigger that's causing signup errors
-- Run this in Supabase SQL Editor

-- Drop the trigger that tries to create profiles automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function as well
DROP FUNCTION IF EXISTS handle_new_user();

-- This will allow user signup to work without database profile creation errors
