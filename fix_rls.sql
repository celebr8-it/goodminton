-- Fix for RLS policy on players table
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON players;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON players;
DROP POLICY IF EXISTS "Users can update their own profile" ON players;

-- Create policies that allow upsert operations
CREATE POLICY "Authenticated users can insert their profile" 
ON players 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can update their profile" 
ON players 
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
