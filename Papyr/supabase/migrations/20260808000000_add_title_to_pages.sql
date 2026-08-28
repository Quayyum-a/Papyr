-- Migration: Add title column to pages table
-- Created: 2026-08-08
-- Purpose: Fix schema mismatch - code references title column that doesn't exist

-- Step 1: Add title column to pages table (nullable, for backward compatibility)
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS title TEXT;

-- Step 2: Add comment
COMMENT ON COLUMN pages.title IS 'Optional title for the page (nullable for backward compatibility)';

-- Migration complete