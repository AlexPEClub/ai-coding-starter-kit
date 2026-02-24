-- Fix trainer_id FK constraints to reference user_profiles instead of auth.users
-- This enables PostgREST to resolve joins like trainer:user_profiles!trainer_id(...)

ALTER TABLE touren
  DROP CONSTRAINT touren_trainer_id_fkey,
  ADD CONSTRAINT touren_trainer_id_fkey
    FOREIGN KEY (trainer_id) REFERENCES user_profiles(id) ON DELETE RESTRICT;

ALTER TABLE termine
  DROP CONSTRAINT termine_trainer_id_fkey,
  ADD CONSTRAINT termine_trainer_id_fkey
    FOREIGN KEY (trainer_id) REFERENCES user_profiles(id) ON DELETE RESTRICT;
