-- =====================================================
-- ACADEMY TABLES
-- =====================================================

-- Table for Courses
CREATE TABLE IF NOT EXISTS academy_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration VARCHAR(50),
  lessons_count INTEGER DEFAULT 0,
  level VARCHAR(50) CHECK (level IN ('Debutant', 'Intermediaire', 'Avance')),
  category VARCHAR(100),
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Lessons
CREATE TABLE IF NOT EXISTS academy_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  video_url TEXT,
  duration VARCHAR(50),
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for User Progress
CREATE TABLE IF NOT EXISTS academy_user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Webinars
CREATE TABLE IF NOT EXISTS academy_webinars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  speaker_name VARCHAR(255),
  video_url TEXT,
  thumbnail_url TEXT,
  is_recorded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Webinar Registrations
CREATE TABLE IF NOT EXISTS academy_webinar_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webinar_id UUID NOT NULL REFERENCES academy_webinars(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, webinar_id)
);

-- RLS Policies
ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Permissions: Everyone can read courses and webinars, only user can see their progress
CREATE POLICY "Everyone can view courses" ON academy_courses FOR SELECT USING (true);
CREATE POLICY "Everyone can view lessons" ON academy_lessons FOR SELECT USING (true);
CREATE POLICY "Users can view own progress" ON academy_user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON academy_user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can view webinars" ON academy_webinars FOR SELECT USING (true);
CREATE POLICY "Users can view own webinar registrations" ON academy_webinar_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own webinar registrations" ON academy_webinar_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert Initial Mock Data
INSERT INTO academy_courses (title, description, duration, lessons_count, level, category)
VALUES 
('Maitriser le CRM Workflow', 'Apprenez a utiliser toutes les fonctionnalites du CRM', '2h 30min', 12, 'Debutant', 'CRM'),
('Techniques de prospection avancees', 'Strategies pour trouver et convertir plus de prospects', '3h 45min', 18, 'Intermediaire', 'Vente'),
('Email marketing efficace', 'Creez des campagnes email qui convertissent', '1h 45min', 8, 'Debutant', 'Marketing'),
('Automatisation des ventes', 'Automatisez vos processus pour gagner du temps', '2h 15min', 10, 'Avance', 'Automation');

INSERT INTO academy_webinars (title, scheduled_at, speaker_name)
VALUES 
('Comment multiplier vos leads par 3', '2026-02-15 14:00:00+00', 'Marie Dupont'),
('Les secrets d''un pipeline performant', '2026-02-22 11:00:00+00', 'Thomas Martin');
