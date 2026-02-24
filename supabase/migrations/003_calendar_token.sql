-- Add calendar_token to user_profiles for ICS calendar subscription
-- Each user gets a unique, stable token to authenticate their personal ICS feed

ALTER TABLE user_profiles
  ADD COLUMN calendar_token UUID DEFAULT gen_random_uuid() NOT NULL;

CREATE UNIQUE INDEX idx_user_profiles_calendar_token ON user_profiles(calendar_token);
