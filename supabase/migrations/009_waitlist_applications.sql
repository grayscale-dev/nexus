CREATE TABLE waitlist_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  estimated_daily_users INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  company TEXT,
  use_case TEXT,
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  profile JSONB
);

ALTER TABLE waitlist_applications
  ADD CONSTRAINT waitlist_applications_estimated_daily_users_min
  CHECK (estimated_daily_users >= 1);

CREATE UNIQUE INDEX waitlist_applications_email_lower_unique
  ON waitlist_applications (lower(email));

ALTER TABLE waitlist_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY waitlist_applications_no_public_read ON waitlist_applications
  FOR SELECT USING (false);

CREATE POLICY waitlist_applications_no_public_write ON waitlist_applications
  FOR INSERT WITH CHECK (false);

CREATE POLICY waitlist_applications_admin_only ON waitlist_applications
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
