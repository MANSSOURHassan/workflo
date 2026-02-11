-- =====================================================
-- FIX ACADEMY TABLES
-- =====================================================
-- This script creates the tables expected by the Academy page code.
-- It resolves mismatches between previous SQL scripts and actual Next.js code.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Academy Courses
CREATE TABLE IF NOT EXISTS academy_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  duration VARCHAR(50), -- "2h 30min" or similar
  lessons_count INTEGER DEFAULT 0,
  level VARCHAR(50) DEFAULT 'Debutant' CHECK (level IN ('Debutant', 'Intermediaire', 'Avance')),
  category VARCHAR(100) DEFAULT 'General',
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Academy Lessons
CREATE TABLE IF NOT EXISTS academy_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  content TEXT,
  video_url TEXT,
  duration VARCHAR(50),
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Academy User Progress
CREATE TABLE IF NOT EXISTS academy_user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES academy_lessons(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('started', 'completed')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Academy Webinars
CREATE TABLE IF NOT EXISTS academy_webinars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  speaker_name VARCHAR(100),
  duration_minutes INTEGER,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Academy Webinar Registrations
CREATE TABLE IF NOT EXISTS academy_webinar_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webinar_id UUID NOT NULL REFERENCES academy_webinars(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, webinar_id)
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Courses: Everyone can read
CREATE POLICY "Public read academy_courses" ON academy_courses FOR SELECT USING (true);

-- Lessons: Everyone can read
CREATE POLICY "Public read academy_lessons" ON academy_lessons FOR SELECT USING (true);

-- Progress: Users manage their own
CREATE POLICY "Users view own progress" ON academy_user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON academy_user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON academy_user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Webinars: Everyone can read
CREATE POLICY "Public read academy_webinars" ON academy_webinars FOR SELECT USING (true);

-- Registrations: Users manage their own
CREATE POLICY "Users view own registrations" ON academy_webinar_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own registrations" ON academy_webinar_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own registrations" ON academy_webinar_registrations FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SAMPLE DATA (To prevent empty page)
-- =====================================================

INSERT INTO academy_courses (title, description, duration, lessons_count, level, category, is_published)
VALUES 
('Maîtriser la Vente Consultative', 'Apprenez à écouter vos prospects et à proposer des solutions adaptées.', '2h 15min', 8, 'Debutant', 'Vente', true),
('Négociation Avancée', 'Techniques de négociation pour les deals complexes.', '4h', 12, 'Avance', 'Négociation', true),
('Prospection Digitale 2.0', 'Utilisez LinkedIn et le Cold Email pour générer des leads.', '3h 30min', 10, 'Intermediaire', 'Marketing', true)
ON CONFLICT DO NOTHING;

INSERT INTO academy_webinars (title, speaker_name, scheduled_at, duration_minutes)
VALUES
('Les secrets du Closing en 2024', 'Thomas Anderson', NOW() + INTERVAL '2 days', 60),
('IA & Vente : Le duo gagnant', 'Sarah Connor', NOW() + INTERVAL '1 week', 45)
ON CONFLICT DO NOTHING;
