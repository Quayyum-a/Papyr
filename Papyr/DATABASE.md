# DATABASE.md

## Database Overview
Papyr uses Supabase PostgreSQL as the primary relational database for storing structured data. The schema is designed to be extensible and follows normalization principles to minimize redundancy.

## Database Schema (Current as of 2026-08-16)

### 1. Profiles Table
Stores user account information linked to Supabase Auth.

```sql
Table: profiles
Columns:
- id: UUID (Primary Key, references auth.users.id)
- email: TEXT (NOT NULL)
- display_name: TEXT
- avatar_url: TEXT
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

### 2. Books Table
Represents a ledger notebook.

```sql
Table: books
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- user_id: UUID (Foreign Key to auth.users.id, NOT NULL, ON DELETE CASCADE)
- title: TEXT (NOT NULL)
- description: TEXT
- cover_color: TEXT DEFAULT '#3B82F6'
- cover_theme: TEXT DEFAULT 'Graphite'
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()

Indexes:
- idx_books_user_id (user_id)
```

### 3. Pages Table
Individual pages within a book.

```sql
Table: pages
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- book_id: UUID (Foreign Key to books.id, NOT NULL, ON DELETE CASCADE)
- page_number: INTEGER (NOT NULL)
- title: TEXT
- content: JSONB DEFAULT '{"strokes": [], "tables": []}'
- position: INTEGER (NOT NULL, for ordering within book)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()

Indexes:
- idx_pages_book_id (book_id)
- idx_pages_book_id_position (book_id, position)

Constraints:
- UNIQUE(book_id, page_number)
```

### 4. Tables (Grids) on Pages
Structured tables that can be placed on pages.

```sql
Table: tables
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- page_id: UUID (Foreign Key to pages.id, NOT NULL, ON DELETE CASCADE)
- title: TEXT
- rows: INTEGER NOT NULL
- columns: INTEGER NOT NULL
- cells: JSONB DEFAULT '[]'
- x: REAL DEFAULT 0
- y: REAL DEFAULT 0
- width: REAL DEFAULT 300
- height: REAL DEFAULT 200
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()

Indexes:
- idx_tables_page_id (page_id)
```

### 5. Strokes Table
Vector stroke data for freehand drawing (legacy freeform canvas + ledger workspace).

```sql
Table: strokes
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- cell_id: UUID (nullable, for ledger workspace cell binding)
- points: JSONB NOT NULL (array of point objects: [{x, y, pressure, timestamp, tiltX, tiltY, twist}])
- tool: TEXT NOT NULL (e.g., 'pen', 'pencil', 'highlighter')
- color: TEXT NOT NULL (hex color)
- width: FLOAT NOT NULL (base width)
- smoothed: BOOLEAN NOT NULL DEFAULT true
- created_at: TIMESTAMPTZ DEFAULT NOW()

Indexes:
- idx_strokes_cell_id (cell_id)
- idx_strokes_created_at (created_at)
```

### 6. Sync Metadata Table
Tracks synchronization state for offline-first capabilities.

```sql
Table: sync_metadata
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- user_id: UUID (Foreign Key to users.id, NOT NULL)
- entity_type: TEXT NOT NULL (e.g., 'stroke', 'cell', 'table')
- entity_id: UUID NOT NULL
- version: INTEGER NOT NULL (starts at 1, increments with each change)
- operation: TEXT NOT NULL (enum: 'INSERT', 'UPDATE', 'DELETE')
- timestamp: TIMESTAMPTZ DEFAULT NOW()
- is_synced: BOOLEAN NOT NULL DEFAULT false
- conflict_resolved: BOOLEAN DEFAULT false

Indexes:
- idx_sync_metadata_user_id (user_id)
- idx_sync_metadata_entity (entity_type, entity_id)
- idx_sync_metadata_unsynced (user_id, is_synced)
```

---

## Migrations Applied

### `20260807000000_add_position_and_update_content_structure.sql`
- Added `position` column to `pages` table
- Backfilled position from `page_number`
- Created index on `(book_id, position)`
- Created helper function: `create_default_ledger_page(book_id)` — inserts a default ledger page with 4-column grid configuration

### `20260808000000_add_title_to_pages.sql`
- Added `title` column to `pages` table (nullable)

---

## Relationships
- Users 1:M Books (a user can have many books)
- Books 1:M Pages (a book contains many pages)
- Pages 1:M Tables (a page can contain many tables)
- Tables 1:M Cells (a table contains many cells) — cells stored in JSONB
- Strokes 1:1 Cell (via `cell_id` in ledger workspace) — optional for backward compatibility

## Row-Level Security (RLS)
All tables have RLS policies enforcing that users can only access their own data:
- Users can only select/update/delete their own rows
- Insert operations automatically set user_id from auth.uid()
- Policies use `auth.uid()` to compare with user_id columns

## Indexes
Primary indexes are defined for performance on foreign keys and frequently queried columns.
Additional indexes may be added based on query patterns observed in production.

## Migrations
All schema changes are managed through Supabase migrations:
- Stored in `supabase/migrations/` directory
- Each migration is timestamped and sequential
- Includes both up (apply) and down (revert) scripts
- Tested against staging database before production deployment

## Extensions
- `uuid-ossp` for UUID generation (enabled in schema)

## Backup Strategy
- Automated daily backups via Supabase
- Point-in-time recovery (PITR) available
- Manual snapshots before major migrations

## Performance Considerations
- Strokes table may grow large; consider partitioning by date or user if needed
- JSONB columns allow flexible schema but are not indexed by default; specific paths can be indexed with GIN indexes
- Connection pooling handled by Supabase (PgBouncer)

## Version
- Document Version: 2.0.0
- Last Updated: 2026-08-16
- **Major change**: Updated to match actual `supabase/schema.sql` + applied migrations