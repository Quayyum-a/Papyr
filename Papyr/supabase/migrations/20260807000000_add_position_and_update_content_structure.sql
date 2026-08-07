-- Migration: Add position column and update content structure for ledger workspace
-- Created: 2026-08-07
-- Purpose: Enable ledger workspace feature with cell-bound ink strokes

-- Step 1: Add position column to pages table
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS position INTEGER;

-- Step 2: Backfill position from page_number for existing pages
UPDATE pages 
SET position = page_number 
WHERE position IS NULL;

-- Step 3: Make position NOT NULL after backfill
ALTER TABLE pages 
ALTER COLUMN position SET NOT NULL;

-- Step 4: Add index for performance (book_id, position queries)
CREATE INDEX IF NOT EXISTS idx_pages_book_position 
ON pages(book_id, position);

-- Step 5: Add comment to document the new content structure
COMMENT ON COLUMN pages.content IS 'JSONB content structure:
- Legacy format: {"strokes": [], "tables": []}
- Ledger format: {"strokes": [{id, segments, color, size, cell_id, createdAt, bounds}], "ledger": {"columns": [{id, label, width, position}], "rowCount": number}}
Both formats are supported for backward compatibility.';

-- Step 6: Create helper function to initialize default ledger page
CREATE OR REPLACE FUNCTION create_default_ledger_page(p_book_id UUID)
RETURNS UUID AS $$
DECLARE
  v_page_id UUID;
  v_next_position INTEGER;
BEGIN
  -- Get next position for this book
  SELECT COALESCE(MAX(position), -1) + 1 
  INTO v_next_position
  FROM pages 
  WHERE book_id = p_book_id;

  -- Insert new page with default ledger structure
  INSERT INTO pages (book_id, page_number, position, content)
  VALUES (
    p_book_id,
    v_next_position, -- page_number matches position for new pages
    v_next_position,
    jsonb_build_object(
      'strokes', jsonb_build_array(),
      'ledger', jsonb_build_object(
        'columns', jsonb_build_array(
          jsonb_build_object('id', gen_random_uuid()::text, 'label', 'Date', 'width', 120, 'position', 0),
          jsonb_build_object('id', gen_random_uuid()::text, 'label', 'Description', 'width', 280, 'position', 1),
          jsonb_build_object('id', gen_random_uuid()::text, 'label', 'Debit', 'width', 120, 'position', 2),
          jsonb_build_object('id', gen_random_uuid()::text, 'label', 'Credit', 'width', 120, 'position', 3)
        ),
        'rowCount', 20
      )
    )
  )
  RETURNING id INTO v_page_id;

  RETURN v_page_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Add comment to helper function
COMMENT ON FUNCTION create_default_ledger_page(UUID) IS 
'Creates a new ledger page with default 4-column structure (Date, Description, Debit, Credit) and 20 empty rows.';

-- Migration complete
-- This migration is safe to run multiple times (idempotent)
