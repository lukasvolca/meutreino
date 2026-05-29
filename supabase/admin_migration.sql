-- ============================================================
-- MeuTreino Admin Panel Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- 2. Helper function to get current user role without recursion
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 3. Set admin role for owner
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'lukasvolca@gmail.com');

-- 4. Create trainer_student_links table
CREATE TABLE IF NOT EXISTS trainer_student_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  requested_at  timestamptz NOT NULL DEFAULT now(),
  approved_at   timestamptz,
  UNIQUE(trainer_id, student_id)
);

ALTER TABLE trainer_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tsl_select" ON trainer_student_links
  FOR SELECT USING (
    trainer_id = auth.uid()
    OR get_my_role() = 'admin'
  );

CREATE POLICY "tsl_insert" ON trainer_student_links
  FOR INSERT WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "tsl_update" ON trainer_student_links
  FOR UPDATE USING (get_my_role() = 'admin');

CREATE POLICY "tsl_delete" ON trainer_student_links
  FOR DELETE USING (
    trainer_id = auth.uid()
    OR get_my_role() = 'admin'
  );

-- 5. Function for trainer to self-request trainer_pending role
CREATE OR REPLACE FUNCTION request_trainer_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET role = 'trainer_pending'
  WHERE id = auth.uid() AND role = 'user';
END;
$$;
GRANT EXECUTE ON FUNCTION request_trainer_role TO authenticated;

-- 6. Function to find profile by email (used in trainer dashboard)
CREATE OR REPLACE FUNCTION get_profile_by_email(email_input text)
RETURNS TABLE(id uuid, nome text, objetivo text, role text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.nome, p.objetivo, p.role
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(u.email) = lower(email_input)
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION get_profile_by_email TO authenticated;

-- 7. Drop old restrictive policies that would block admin/trainer access
-- (adjust names to match whatever is in your project)
DO $$ BEGIN
  -- Common default policy names from Supabase templates:
  DROP POLICY IF EXISTS "Users can view own profile." ON profiles;
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
  DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
  DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
  DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can CRUD own fichas" ON fichas;
  DROP POLICY IF EXISTS "fichas_all_own" ON fichas;
  DROP POLICY IF EXISTS "Enable all for owner" ON fichas;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can CRUD own exercicios" ON exercicios;
  DROP POLICY IF EXISTS "exercicios_all_own" ON exercicios;
  DROP POLICY IF EXISTS "Enable all for owner" ON exercicios;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 8. Recreate profiles policies
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM trainer_student_links tsl
      WHERE tsl.trainer_id = auth.uid()
        AND tsl.student_id = profiles.id
        AND tsl.status = 'approved'
    )
  );

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR get_my_role() = 'admin'
  );

-- 9. Recreate fichas policies
CREATE POLICY "fichas_all" ON fichas
  FOR ALL USING (
    user_id = auth.uid()
    OR get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM trainer_student_links tsl
      WHERE tsl.trainer_id = auth.uid()
        AND tsl.student_id = fichas.user_id
        AND tsl.status = 'approved'
    )
  );

-- 10. Recreate exercicios policies
CREATE POLICY "exercicios_all" ON exercicios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fichas f
      WHERE f.id = exercicios.ficha_id AND (
        f.user_id = auth.uid()
        OR get_my_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM trainer_student_links tsl
          WHERE tsl.trainer_id = auth.uid()
            AND tsl.student_id = f.user_id
            AND tsl.status = 'approved'
        )
      )
    )
  );
