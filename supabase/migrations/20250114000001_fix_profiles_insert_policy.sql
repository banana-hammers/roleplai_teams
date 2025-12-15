-- Fix RLS policy for profiles table
-- Add missing INSERT policy to allow users to create their own profile during signup

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
