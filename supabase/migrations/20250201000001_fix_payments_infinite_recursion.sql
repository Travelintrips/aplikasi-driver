-- Fix infinite recursion in payments table policies
-- Disable RLS temporarily to avoid recursion issues
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON payments;
DROP POLICY IF EXISTS "Allow users to view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON payments;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON payments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON payments;

-- Create simple policies without recursion
CREATE POLICY "Enable insert for authenticated users only"
ON payments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users only"
ON payments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users only"
ON payments FOR UPDATE
TO authenticated
USING (true);

-- Re-enable RLS with the new simple policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;