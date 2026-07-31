# DATABASE.md

## Database Overview
Papyr uses Supabase PostgreSQL as the primary relational database for storing structured data. The schema is designed to be extensible and follows normalization principles to minimize redundancy.

## Database Schema

### 1. Users Table
Stores user account information linked to Supabase Auth.

```sql
Table: users
Columns:
- id: UUID (Primary Key, references auth.users.id)
- email: TEXT (Unique, from auth.users.email)
- full_name: TEXT
- avatar_url: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 2. Books Table
Represents a ledger notebook.

```sql
Table: books
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- user_id: UUID (Foreign Key to users.id, NOT NULL)
- title: TEXT (NOT NULL)
- cover_color: TEXT (NOT NULL, references color palette)
- created_at: TIMESTAMPTZ (NOT NULL, default now())
- updated_at: TIMESTAMPTZ (NOT NULL, default now())
- archived: BOOLEAN (DEFAULT false)
Indexes:
- idx_books_user_id (user_id)
- idx_books_updated_at (updated_at)
```

### 3. Pages Table
Individual pages within a book.

```sql
Table: pages
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- book_id: UUID (Foreign Key to books.id, NOT NULL, ON DELETE CASCADE)
- title: TEXT (Optional, e.g., "January Expenses")
- position: INTEGER (NOT NULL, for ordering within book)
- created_at: TIMESTAMPTZ (NOT NULL, default now())
- updated_at: TIMESTAMPTZ (NOT NULL, default now())
Indexes:
- idx_pages_book_id (book_id)
- idx_pages_book_id_position (book_id, position)
```

### 4. Tables (Grids) on Pages
Structured tables that can be placed on pages.

```sql
Table: tables
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- page_id: UUID (Foreign Key to pages.id, NOT NULL, ON DELETE CASCADE)
- title: TEXT (Optional)
- columns: JSONB (NOT NULL, array of column definitions: [{id, label, width}])
- rows: JSONB (NOT NULL, array of row data, each cell can contain rich content)
- width: INTEGER (NOT NULL, total width in grid units)
- height: INTEGER (NOT NULL, total height in grid units)
- position_x: INTEGER (NOT NULL, x-coordinate on page)
- position_y: INTEGER (NOT NULL, y-coordinate on page)
- created_at: TIMESTAMPTZ (NOT NULL, default now())
- updated_at: TIMESTAMPTZ (NOT NULL, default now())
Indexes:
- idx_tables_page_id (page_id)
```

### 5. Cells Table
Individual cells that can contain freehand drawing or other content.

```sql
Table: cells
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- table_id: UUID (Foreign Key to tables.id, NOT NULL, ON DELETE CASCADE)
- row_index: INTEGER (NOT NULL)
- column_index: INTEGER (NOT NULL)
- content_type: TEXT (NOT NULL, enum: 'ink', 'text', 'empty')
- content_data: JSONB (nullable, stores content based on type)
  - For 'ink': {stroke_ids: UUID[]}
  - For 'text': {text: string, formatting: object}
  - For 'empty': null
- width: INTEGER (NOT NULL, column width at time of creation)
- height: INTEGER (NOT NULL, row height at time of creation)
- created_at: TIMESTAMPTZ (NOT NULL, default now())
- updated_at: TIMESTAMPTZ (NOT NULL, default now())
Indexes:
- idx_cells_table_id (table_id)
- idx_cells_table_id_row_col (table_id, row_index, column_index)
```

### 6. Strokes Table
Vector stroke data for freehand drawing.

```sql
Table: strokes
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- cell_id: UUID (Foreign Key to cells.id, NOT NULL, ON DELETE CASCADE)
- points: JSONB (NOT NULL, array of point objects: [{x, y, pressure, timestamp, tiltX, tiltY, twist}])
- tool: TEXT (NOT NULL, e.g., 'pen', 'pencil', 'highlighter')
- color: TEXT (NOT NULL, hex color)
- width: FLOAT (NOT NULL, base width)
- smoothed: BOOLEAN (NOT NULL, default true, whether processed by perfect-freehand)
- created_at: TIMESTAMPTZ (NOT NULL, default now())
Indexes:
- idx_strokes_cell_id (cell_id)
- idx_strokes_created_at (created_at)
```

### 7. Sync Metadata Table
Tracks synchronization state for offline-first capabilities.

```sql
Table: sync_metadata
Columns:
- id: UUID (Primary Key, default uuid_generate_v4())
- user_id: UUID (Foreign Key to users.id, NOT NULL)
- entity_type: TEXT (NOT NULL, e.g., 'stroke', 'cell', 'table')
- entity_id: UUID (NOT NULL)
- version: INTEGER (NOT NULL, starts at 1, increments with each change)
- operation: TEXT (NOT NULL, enum: 'INSERT', 'UPDATE', 'DELETE')
- timestamp: TIMESTAMPTZ (NOT NULL, default now())
- is_synced: BOOLEAN (NOT NULL, default false)
- conflict_resolved: BOOLEAN (DEFAULT false)
Indexes:
- idx_sync_metadata_user_id (user_id)
- idx_sync_metadata_entity (entity_type, entity_id)
- idx_sync_metadata_unsynced (user_id, is_synced)
```

## Relationships
- Users 1:M Books (a user can have many books)
- Books 1:M Pages (a book contains many pages)
- Pages 1:M Tables (a page can contain many tables)
- Tables 1:M Cells (a table contains many cells)
- Cells 1:M Strokes (a cell can contain many stroke groups)

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
Planned PostgreSQL extensions:
- `uuid-ossp` for UUID generation
- `btree_gin` for indexing JSONB columns
- `pgcrypto` for cryptographic functions (if needed)

## Backup Strategy
- Automated daily backups via Supabase
- Point-in-time recovery (PITR) available
- Manual snapshots before major migrations

## Performance Considerations
- Strokes table may grow large; consider partitioning by date or user if needed
- JSONB columns allow flexible schema but are not indexed by default; specific paths can be indexed with GIN indexes
- Connection pooling handled by Supabase (PgBouncer)

## Version
- Document Version: 1.0.0
- Last Updated: 2026-07-31