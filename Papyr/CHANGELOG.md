# CHANGELOG.md

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added - Supabase Integration (2026-08-07)
- **Database Integration:** Full Supabase PostgreSQL integration for ledger workspace
  - Load pages from database with authentication verification
  - Create default ledger pages automatically via RPC function (`create_default_ledger_page`)
  - Save page content with 500ms debouncing
  - Load initial strokes from database on page mount
- **Ink Engine Enhancement:** Added `loadStrokes` method for batch loading strokes
- **Error Handling:** Graceful error states for database operations
- **Mock Client Update:** Added `limit()` and `rpc()` methods to Supabase mock client
- **Testing:** Integration tests for PageData interface and content structure

### Changed - Supabase Integration (2026-08-07)
- Page loading now queries real database instead of placeholder
- Strokes persist to database automatically after drawing
- Column edits save to database with debouncing
- Authentication required to access ledger workspace (redirects to login)

### Added - Ledger Workspace Feature (2026-08-07)
- **New Route:** `/dashboard/books/[id]/ledger` - Full ledger workspace experience
- **Three-Layer Canvas System:**
  - Paper layer with realistic texture (`#F8F6EE` warm off-white + subtle grain)
  - Grid layer with professional ledger lines (44px rows, variable columns)
  - Ink layer with premium stroke rendering (<16ms latency)
- **Cell Selection:** Tap cells to select with yellow highlight (`#FFFBEA`)
- **Cell-Bound Ink:** Strokes automatically bind to selected cells
- **Column Management:**
  - Tap-and-hold headers to edit (500ms)
  - Auto-width calculation (9px per character + 40px padding)
  - Add columns with "+" button
  - Remove columns with "×" button (minimum 1 enforced)
- **Accessibility:**
  - Full keyboard navigation (Tab, Enter, Space, Escape)
  - ARIA labels on all interactive elements
  - Screen reader friendly
- **Components Created:**
  - `LedgerCanvas` - Main canvas orchestrator
  - `PaperLayer` - Realistic paper background
  - `GridLayer` - Row and column lines
  - `InkLayer` - Ink stroke rendering
  - `ColumnHeaders` - Editable column headers
  - `CellHighlights` - Cell selection overlay
- **Hooks Created:**
  - `useLedgerCanvas` - Canvas lifecycle management
  - `useCellSelection` - Cell selection state
  - `useLedgerConfig` - Column management
  - `useLedgerWorkspace` - Master workspace orchestrator
- **Database Migration:** Added `position` column to pages table
- **Type System:** Extended `Stroke` interface with optional `cell_id` field
- **Tests:** 36 comprehensive tests (all passing ✅)

### Added - Previous Features
- Project repository initialized with Git
- Created README.md with project overview
- Established documentation folder structure (/docs)
- Created PROJECT_CONTEXT.md as permanent project memory
- Set up development environment with Next.js 14, TypeScript, TailwindCSS
- Configured Supabase client for backend services
- Implemented basic canvas drawing with perfect-freehand integration
- Added responsive canvas that resizes with window
- Implemented pointer event handling for mouse, touch, and pen input
- Added Stroke data model (TypeScript interface for Stroke and StrokePoint)
- Implemented undo/redo functionality with keyboard shortcuts (Ctrl+Z, Ctrl+Y) and UI buttons
- Added pressure sensitivity support (using average pressure to adjust stroke width)

### Changed
- Updated package.json to use Next.js 14 and React 18
- Configured Tailwind CSS with custom color palette
- Set up TypeScript configuration with path aliases
- Extended existing ink engine to support cell binding (backward compatible)
- Added navigation button to book page for workspace access

### Fixed
- Initialized npm project with correct naming (lowercase)
- Fixed Tailwind CSS configuration files
- Database schema error (pages.position column now exists)

## [0.1.0] - 2026-07-31
### Added
- Initial project setup
- Basic drawing canvas with smooth stroke rendering