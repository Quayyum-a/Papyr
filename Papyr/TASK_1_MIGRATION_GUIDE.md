# Task 1: Database Migration Guide

## Overview
This guide walks through applying the database migration to add the `position` column and prepare for the ledger workspace feature.

## Migration File
**Location:** `/supabase/migrations/20260807000000_add_position_and_update_content_structure.sql`

**Status:** ✅ Created, ready to apply

---

## What the Migration Does

1. **Adds `position` column** to `pages` table (INTEGER, NOT NULL)
2. **Backfills** position values from existing `page_number`
3. **Creates index** on `(book_id, position)` for query performance
4. **Adds helper function** `create_default_ledger_page(book_id)` for creating new pages
5. **Documents** the content structure in column comment

---

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to SQL Editor
4. Copy the entire migration file content
5. Paste into SQL Editor
6. Click "Run"
7. Verify: "Success. No rows returned" message

### Option 2: Supabase CLI
```bash
cd /Users/user/Ledger/Papyr

# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
npx supabase db push
```

---

## Verification Steps

### Step 1: Check Column Exists
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'pages' AND column_name = 'position';
```

**Expected Result:**
```
column_name | data_type | is_nullable
------------|-----------|------------
position    | integer   | NO
```

### Step 2: Check Index Created
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'pages' AND indexname = 'idx_pages_book_position';
```

**Expected Result:**
Should return one row with the index definition.

### Step 3: Test Helper Function
```sql
-- Create a test book first (replace with actual book_id)
SELECT create_default_ledger_page('YOUR_BOOK_ID_HERE');
```

**Expected Result:**
Returns a UUID (the new page ID).

### Step 4: Verify Page Content
```sql
SELECT id, book_id, position, content
FROM pages
WHERE id = 'THE_UUID_FROM_STEP_3';
```

**Expected Result:**
```json
{
  "strokes": [],
  "ledger": {
    "columns": [
      {"id": "...", "label": "Date", "width": 120, "position": 0},
      {"id": "...", "label": "Description", "width": 280, "position": 1},
      {"id": "...", "label": "Debit", "width": 120, "position": 2},
      {"id": "...", "label": "Credit", "width": 120, "position": 3}
    ],
    "rowCount": 20
  }
}
```

---

## Rollback Plan (If Needed)

```sql
-- Remove the helper function
DROP FUNCTION IF EXISTS create_default_ledger_page(UUID);

-- Remove the index
DROP INDEX IF EXISTS idx_pages_book_position;

-- Remove the position column
ALTER TABLE pages DROP COLUMN IF EXISTS position;
```

**Note:** Only use rollback if there's a critical issue. The migration is designed to be safe and non-destructive.

---

## Common Issues & Solutions

### Issue 1: "column position already exists"
**Cause:** Migration was already applied  
**Solution:** This is safe - the migration uses `IF NOT EXISTS` checks

### Issue 2: "position column has NULL values"
**Cause:** Backfill step failed  
**Solution:** Run manually:
```sql
UPDATE pages SET position = page_number WHERE position IS NULL;
```

### Issue 3: "function create_default_ledger_page already exists"
**Cause:** Function was created in a previous run  
**Solution:** This is safe - migration uses `CREATE OR REPLACE`

---

## Next Steps After Migration

1. ✅ Verify all checks pass
2. ✅ Test helper function with real book
3. ✅ Move to **Task 2: Update Type Definitions**
4. ✅ Update `PROGRESS.md` to mark Task 1 complete

---

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard
2. Verify RLS policies are enabled
3. Ensure you have proper permissions
4. Review migration file for typos

**Migration is idempotent** - safe to run multiple times!
