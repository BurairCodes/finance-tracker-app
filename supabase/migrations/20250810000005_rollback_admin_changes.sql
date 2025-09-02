/*
  # Rollback Admin Panel Changes
  
  This migration removes the user_role and is_active columns
  and admin_actions table that were added for admin panel functionality.
  This restores the database to its original state.
*/

-- Drop admin_actions table if it exists (ignore if it doesn't exist)
DROP TABLE IF EXISTS admin_actions CASCADE;

-- Drop ALL admin-related policies first (including any that might exist)
-- Note: These policies might not exist, but we'll try to drop them anyway
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Drop admin-related functions (ignore if they don't exist)
DROP FUNCTION IF EXISTS create_initial_admin(text);
DROP FUNCTION IF EXISTS is_admin(uuid);

-- Drop admin-related indexes (ignore if they don't exist)
DROP INDEX IF EXISTS idx_profiles_user_role;
DROP INDEX IF EXISTS idx_profiles_is_active;
DROP INDEX IF EXISTS idx_admin_actions_created_at;
DROP INDEX IF EXISTS idx_admin_actions_action_type;

-- Now remove columns with CASCADE to handle any remaining dependencies
-- Note: These columns might not exist, but we'll try to remove them anyway
ALTER TABLE profiles DROP COLUMN IF EXISTS user_role CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_active CASCADE;

-- Restore original handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, base_currency)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'PKR'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
