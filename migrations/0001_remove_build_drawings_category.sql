-- Remove category column from build_drawings table
-- This column was mistakenly included in the initial migration
-- The frontend doesn't use this field and it conflicts with the schema definition

ALTER TABLE "build_drawings" DROP COLUMN IF EXISTS "category"; 