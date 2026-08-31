/*
# PrepPilot Schema - Initial Tables

Creates the core tables for the PrepPilot interview practice SaaS:
profiles, interviews, interview_questions, interview_answers, study_plans, study_plan_items.

1. New Tables
- `profiles`: user profile info (full name, avatar url), one row per auth user
- `interviews`: interview sessions with config (role, topics, duration, difficulty, mode, style) and results (overall_score, status)
- `interview_questions`: questions asked during an interview, ordered by question_number
- `interview_answers`: user's answer to a question, with score and structured evaluation JSON
- `study_plans`: a personalized study plan generated from an interview's weaknesses
- `study_plan_items`: individual items in a study plan, markable as completed

2. Security
- RLS enabled on every table.
- Owner-scoped CRUD policies (TO authenticated) using auth.uid() = user_id.
- profiles uses user_id = auth.uid() ownership.
- Child tables (questions, answers, study_plan_items) scoped via EXISTS check on parent ownership.
- All owner columns default to auth.uid() so client inserts omitting user_id still pass WITH CHECK.

3. Notes
- topics stored as text[] array.
- evaluation stored as jsonb for flexible structured AI output.
- Foreign keys cascade on delete so deleting an interview removes its questions/answers.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- interviews
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'technical',
  experience_level text NOT NULL DEFAULT 'junior',
  topics text[] NOT NULL DEFAULT '{}',
  duration integer NOT NULL DEFAULT 10,
  difficulty text NOT NULL DEFAULT 'adaptive',
  mode text NOT NULL DEFAULT 'technical',
  style text NOT NULL DEFAULT 'professional',
  overall_score integer,
  status text NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_interviews" ON interviews;
CREATE POLICY "select_own_interviews" ON interviews FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_interviews" ON interviews;
CREATE POLICY "insert_own_interviews" ON interviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_interviews" ON interviews;
CREATE POLICY "update_own_interviews" ON interviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_interviews" ON interviews;
CREATE POLICY "delete_own_interviews" ON interviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS interviews_user_id_created_at_idx ON interviews (user_id, created_at DESC);

-- interview_questions
CREATE TABLE IF NOT EXISTS interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question text NOT NULL,
  topic text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'adaptive',
  question_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_questions" ON interview_questions;
CREATE POLICY "select_own_questions" ON interview_questions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = interview_questions.interview_id AND interviews.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_questions" ON interview_questions;
CREATE POLICY "insert_own_questions" ON interview_questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = interview_questions.interview_id AND interviews.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_questions" ON interview_questions;
CREATE POLICY "update_own_questions" ON interview_questions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = interview_questions.interview_id AND interviews.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = interview_questions.interview_id AND interviews.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_questions" ON interview_questions;
CREATE POLICY "delete_own_questions" ON interview_questions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = interview_questions.interview_id AND interviews.user_id = auth.uid())
  );

-- interview_answers
CREATE TABLE IF NOT EXISTS interview_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
  answer text NOT NULL DEFAULT '',
  score integer,
  evaluation jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE interview_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_answers" ON interview_answers;
CREATE POLICY "select_own_answers" ON interview_answers FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = interview_answers.interview_id AND interviews.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_answers" ON interview_answers;
CREATE POLICY "insert_own_answers" ON interview_answers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = interview_answers.interview_id AND interviews.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_answers" ON interview_answers;
CREATE POLICY "update_own_answers" ON interview_answers FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = interview_answers.interview_id AND interviews.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = interview_answers.interview_id AND interviews.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_answers" ON interview_answers;
CREATE POLICY "delete_own_answers" ON interview_answers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = interview_answers.interview_id AND interviews.user_id = auth.uid())
  );

-- study_plans
CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_id uuid REFERENCES interviews(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_study_plans" ON study_plans;
CREATE POLICY "select_own_study_plans" ON study_plans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_study_plans" ON study_plans;
CREATE POLICY "insert_own_study_plans" ON study_plans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_study_plans" ON study_plans;
CREATE POLICY "update_own_study_plans" ON study_plans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_study_plans" ON study_plans;
CREATE POLICY "delete_own_study_plans" ON study_plans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- study_plan_items
CREATE TABLE IF NOT EXISTS study_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_id uuid NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE study_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_study_plan_items" ON study_plan_items;
CREATE POLICY "select_own_study_plan_items" ON study_plan_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM study_plans WHERE study_plans.id = study_plan_items.study_plan_id AND study_plans.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_study_plan_items" ON study_plan_items;
CREATE POLICY "insert_own_study_plan_items" ON study_plan_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM study_plans WHERE study_plans.id = study_plan_items.study_plan_id AND study_plans.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_study_plan_items" ON study_plan_items;
CREATE POLICY "update_own_study_plan_items" ON study_plan_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM study_plans WHERE study_plans.id = study_plan_items.study_plan_id AND study_plans.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM study_plans WHERE study_plans.id = study_plan_items.study_plan_id AND study_plans.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_study_plan_items" ON study_plan_items;
CREATE POLICY "delete_own_study_plan_items" ON study_plan_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM study_plans WHERE study_plans.id = study_plan_items.study_plan_id AND study_plans.user_id = auth.uid())
  );
