# Ledger Workspace Implementation Plan - REVISED
**Version:** 2.0  
**Date:** 2026-08-07  
**Status:** Ready for Implementation

---

## Executive Summary

This revised plan adapts the original ledger workspace vision to the current Papyr codebase state. After auditing the existing ink engine (Sprint 0 complete, production-ready), we've adjusted the implementation strategy to **reuse** rather than rebuild, and to **extend** rather than replace existing features.

### Key Changes from Original Plan
1. ✅ **Ink engine already exists** - Premium quality, <16ms latency achieved
2. ✅ **Database migration simplified** - Add position column only
3. ✅ **New route strategy** - `/dashboard/books/[id]/ledger` (don't replace `/canvas`)
4. ✅ **Reduced task count** - 8 tasks instead of 10 (integration > building)
5. ✅ **Clearer data model** - Ledger format coexists with legacy format

---

## Audit Findings: Existing Ink Engine

### ✅ Production-Ready Components

**Core Engine (`/src/lib/ink-engine/`):**
- `stroke-renderer.ts` - Quadratic bezier rendering with pressure tapering
- `pressure-simulator.ts` - Velocity-based pressure simulation
- `render-loop.ts` - RequestAnimationFrame-based rendering
- `canvas-renderer.ts` - Offscreen canvas compositing
- `types.ts` - Complete type definitions


**Hook (`/src/hooks/`):**
- `useInkEngine.ts` - Full state management, undo/redo, pen configuration

**Features Already Working:**
- ✅ Natural pressure simulation (velocity-based)
- ✅ Catmull-Rom smoothing (preserves handwriting personality)
- ✅ Multiple pen sizes (extra-fine → marker)
- ✅ Color picker
- ✅ Undo/redo with full history
- ✅ <16ms latency target achieved
- ✅ Offscreen canvas optimization
- ✅ Tail rendering for real-time performance
- ✅ Mobile responsiveness
- ✅ Pointer capture (multi-touch safe)

### 📊 Data Model Analysis

**Existing Stroke Model** (`/src/lib/ink-engine/types.ts`):
```typescript
interface Stroke {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  size: PenSize;
  segments: StrokeSegment[];
  createdAt: number;
  bounds: { minX, minY, maxX, maxY };
}
```

**Perfect for Cell Binding!** We only need to add:
```typescript
cell_id?: string | null; // Add this field
```


**Current Page Content Structure:**
```json
{
  "strokes": [],
  "tables": []
}
```

**New Ledger Content Structure** (backward compatible):
```json
{
  "strokes": [
    {
      "id": "uuid",
      "segments": [...],
      "color": "#000000",
      "size": "medium",
      "createdAt": 1234567890,
      "bounds": {...},
      "cell_id": "col-0-row-5" // NEW: null for free ink
    }
  ],
  "ledger": {
    "columns": [
      {"id": "uuid", "label": "Date", "width": 120, "position": 0}
    ],
    "rowCount": 20
  }
}
```

---

## Architecture Decisions

### Decision 1: Separate Route
**Choice:** Create `/dashboard/books/[id]/ledger` route  
**Rationale:**
- Keep existing canvas working (no breaking changes)
- Allow users to toggle between Canvas and Ledger modes
- Easier testing and rollback


### Decision 2: Extend Existing Types
**Choice:** Add optional `cell_id` field to existing `Stroke` interface  
**Rationale:**
- Minimal changes to working code
- Backward compatible (undefined = null)
- Leverages existing serialization

### Decision 3: Component Namespace
**Choice:** Create `/src/components/ledger-workspace/` directory  
**Rationale:**
- Avoid naming conflicts
- Clear separation from canvas components
- Organized imports

### Decision 4: Reuse Ink Engine
**Choice:** Use existing `useInkEngine` hook with extensions  
**Rationale:**
- Proven performance (<16ms)
- Complete feature set
- No risk of regression

---

## Revised Task Breakdown

### ✅ **TASK 0: Audit Complete**
**Status:** DONE  
**Deliverables:** This document

---

### **TASK 1: Database Migration & Schema Updates**

**Objective:** Add position column and prepare database for ledger workspace.

**Migration Created:** `/supabase/migrations/20260807000000_add_position_and_update_content_structure.sql`

**Changes:**
1. Add `position` INTEGER column to `pages` table
2. Backfill from `page_number` for existing pages
3. Add index on `(book_id, position)`
4. Create helper function: `create_default_ledger_page(book_id)`
5. Document content structure in column comment

**Implementation Steps:**
```bash
# Apply migration
cd Papyr
# Connect to Supabase and run migration
```

**Tests:**
- [ ] Migration runs successfully (no errors)
- [ ] Existing pages have position values
- [ ] `create_default_ledger_page()` function works
- [ ] Index improves query performance

**Success Criteria:**
- All pages have `position` column filled
- Helper function creates pages with default 4 columns
- No breaking changes to existing data

---

### **TASK 2: Update Type Definitions**

**Objective:** Extend existing types to support cell binding.

**Files to Modify:**
- `/src/lib/ink-engine/types.ts` - Add `cell_id` to `Stroke`
- `/src/types/ledger.ts` (NEW) - Define ledger-specific types

**New Types:**
```typescript
// /src/types/ledger.ts
export interface LedgerColumn {
  id: string;
  label: string;
  width: number;
  position: number;
}

export interface LedgerConfig {
  columns: LedgerColumn[];
  rowCount: number;
}

export interface LedgerPageContent {
  strokes: Array<StrokeWithCell>;
  ledger: LedgerConfig;
}

export interface StrokeWithCell extends Stroke {
  cell_id?: string | null;
}

export interface CellCoordinates {
  columnIndex: number;
  rowIndex: number;
}
```

**Modifications:**
```typescript
// /src/lib/ink-engine/types.ts
export interface Stroke {
  // ... existing fields
  cell_id?: string | null; // Add this
}
```

**Tests:**
- [ ] TypeScript compilation passes
- [ ] Existing code still works (backward compatible)

---

### **TASK 3: Create Ledger Canvas Components**

**Objective:** Build the layered canvas system with paper texture and grid.

**New Files:**
```
/src/components/ledger-workspace/
├── LedgerCanvas.tsx          # Main canvas container
├── PaperLayer.tsx            # Paper texture background
├── GridLayer.tsx             # Ledger grid lines
├── InkLayer.tsx              # Wrapper for ink rendering
└── index.ts                  # Exports
```

**PaperLayer Implementation:**
- Canvas background: `#F8F6EE` (warm off-white)
- SVG noise filter for subtle grain (3% opacity)
- Full canvas size with proper DPI scaling

**GridLayer Implementation:**
- Horizontal lines: `#E5E5E5`, 1px, 44px spacing
- Vertical dividers: `#D8D2C2`, 1px, based on column widths
- Renders on separate canvas above paper

**LedgerCanvas Integration:**
- Stacks three canvases: Paper (z:1) → Ink (z:2) → Overlay (z:3)
- Reuses existing `CanvasRenderer` and `StrokeRenderer`
- Proper pointer event handling

**Tests:**
- [ ] Canvas renders at correct DPI (1x, 2x, 3x)
- [ ] Grid lines align with 44px cell height
- [ ] Paper texture is subtle and professional
- [ ] Responsive to window resize

---

### **TASK 4: Build Ledger Overlay Components**

**Objective:** Create HTML overlay for column headers and cell selection.

**New Files:**
```
/src/components/ledger-workspace/
├── ColumnHeaders.tsx         # Editable headers
├── CellHighlights.tsx        # Selection feedback
├── ColumnControls.tsx        # Add/remove buttons
└── useCellSelection.ts       # Selection hook
```

**ColumnHeaders Features:**
- Absolute positioning above canvas
- Tap-and-hold (500ms) to edit
- Quick tap selects entire column
- Auto-width calculation based on label length
- Minimum width: 80px

**CellHighlights Features:**
- Invisible clickable grid matching canvas cells
- Selected cell: `bg-[#FFFBEA]` (pale yellow, 50% opacity)
- Tap to select, tap outside to clear
- Column selection highlights all cells

**ColumnControls Features:**
- "+" button beside last header (adds column)
- "×" button on hover (removes column, minimum 1)
- Confirmation modal if column contains ink

**Tests:**
- [ ] Tap-and-hold triggers edit (not select)
- [ ] Quick tap selects cell
- [ ] Cell highlights align with grid
- [ ] Add/remove column works correctly

---

### **TASK 5: Create Book Ledger Page Route**

**Objective:** Build new `/dashboard/books/[id]/ledger` page with full integration.

**New File:**
- `/src/app/dashboard/books/[id]/ledger/page.tsx`

**Implementation:**
- Reuse existing `useInkEngine` hook (extend, don't replace)
- Integrate `LedgerCanvas` + `ColumnHeaders` + `CellHighlights`
- Load page data from Supabase
- Auto-create default page if book has no pages
- Navigation: Toggle between "Canvas" and "Ledger" modes

**State Management:**
```typescript
// Extends useInkEngine with ledger state
const useLedgerWorkspace = (bookId: string, pageId: string) => {
  const inkEngine = useInkEngine();
  const [ledgerConfig, setLedgerConfig] = useState<LedgerConfig>(...);
  const [selectedCell, setSelectedCell] = useState<CellCoordinates | null>(null);
  
  // Load page from DB
  // Save debounced (500ms)
  // Cell selection tracking
  
  return { ...inkEngine, ledgerConfig, selectedCell, ... };
};
```

**Tests:**
- [ ] Page loads successfully
- [ ] Creates default page for new books
- [ ] Navigation toggle works
- [ ] No regressions in canvas page

---

### **TASK 6: Implement Cell Binding for Ink Strokes**

**Objective:** Connect ink strokes to selected cells automatically.

**Files to Modify:**
- `/src/hooks/useInkEngine.ts` - Add cell_id parameter to `createStroke`
- `/src/components/ledger-workspace/useLedgerWorkspace.ts` (NEW)

**Implementation:**
```typescript
// Modify createStroke to accept optional cell_id
const createStroke = useCallback(
  (points: RawPoint[], cell_id?: string | null): Stroke => {
    // ... existing code
    return {
      // ... existing fields
      cell_id: cell_id ?? null, // Add cell binding
    };
  },
  [state.currentPenSize, state.currentColor]
);

// In ledger workspace
const handlePointerUp = (e: React.PointerEvent) => {
  // ... existing pointer handling
  const cellId = selectedCell 
    ? `col-${selectedCell.columnIndex}-row-${selectedCell.rowIndex}`
    : null;
  
  const stroke = createStroke(stateRef.current.points, cellId);
  addStroke(stroke);
};
```

**Save to Database:**
- Debounce saves (500ms after last stroke)
- Update `pages.content` JSONB with full stroke array
- Preserve ledger config on each save

**Tests:**
- [ ] Stroke with selected cell has cell_id
- [ ] Stroke without selection has cell_id = null
- [ ] Strokes persist to database correctly
- [ ] Cell_id format is consistent

---

### **TASK 7: Add Column Management Features**

**Objective:** Enable dynamic column add/edit/remove operations.

**Implementation:**

**Add Column:**
```typescript
const addColumn = () => {
  const newColumn: LedgerColumn = {
    id: uuidv4(),
    label: "New Column",
    width: 120,
    position: columns.length,
  };
  setLedgerConfig(prev => ({
    ...prev,
    columns: [...prev.columns, newColumn],
  }));
};
```

**Edit Column:**
- Tap-and-hold header → Show inline input
- Auto-calculate width: `label.length * 9 + 40` (min: 80px, max: 400px)
- Save on blur

**Remove Column:**
- Show "×" on hover (desktop) or always (mobile)
- Check if column has bound strokes
- If yes: Show confirmation modal
- If confirmed: Orphan strokes (set cell_id = null)
- Minimum 1 column enforced

**Tests:**
- [ ] Add column creates correct structure
- [ ] Edit column updates width correctly
- [ ] Remove column orphans strokes
- [ ] Cannot remove last column
- [ ] Changes persist to database

---

### **TASK 8: Testing, Documentation & Polish**

**Objective:** Ensure production readiness with comprehensive testing.

**Unit Tests:**
```typescript
// /src/components/ledger-workspace/__tests__/
- LedgerCanvas.test.tsx
- ColumnHeaders.test.tsx
- CellHighlights.test.tsx
- useCellSelection.test.ts
- useLedgerWorkspace.test.ts
```

**Integration Tests:**
- Full flow: Open book → Select cell → Draw → Verify save
- Column management: Add/edit/remove workflows
- Cell navigation: Keyboard and touch interactions
- Undo/redo with cell-bound strokes

**E2E Test (Playwright):**
```typescript
test('ledger workspace full workflow', async ({ page }) => {
  // Create book
  // Navigate to ledger
  // Draw in multiple cells
  // Verify persistence
  // Verify ink appears on reload
});
```

**Documentation Updates:**
- `PROGRESS.md` - Mark Phase 3 tasks complete
- `CHANGELOG.md` - Document ledger workspace feature
- `API.md` - Document helper function
- JSDoc comments in all new components

**Code Quality:**
- Run `npm run lint` (fix all issues)
- Run `npm run typecheck` (no errors)
- Run `npm run test` (all pass)
- Run `npm run build` (successful)

---


## Success Criteria (Revised)

Upon completion, users should be able to:

1. ✅ Navigate to `/dashboard/books/[id]/ledger` route
2. ✅ See realistic ledger paper with grid (no database errors)
3. ✅ Auto-create default page with 4 columns (Date, Description, Debit, Credit)
4. ✅ Tap cells to select them (subtle yellow highlight)
5. ✅ Draw with finger/stylus on paper (using existing premium ink engine)
6. ✅ Have strokes automatically bind to selected cell
7. ✅ Draw freely in margins (strokes saved with cell_id = null)
8. ✅ Tap-and-hold headers to edit column names
9. ✅ Add new columns with "+" button
10. ✅ Remove columns with "×" button (confirms if has data)
11. ✅ See column widths adjust automatically
12. ✅ Use undo/redo (works with cell-bound strokes)
13. ✅ Switch between Canvas and Ledger modes
14. ✅ Have all changes persist to Supabase
15. ✅ Experience <16ms ink latency (existing performance maintained)

---

## Performance Notes

**No Optimization Task Needed** ✅  
The existing ink engine already achieves:
- <16ms latency (Sprint 0 validated)
- Offscreen canvas optimization
- Tail rendering for long strokes
- Stable 60+ FPS

**What to Monitor:**
- Cell selection/highlighting overhead (should be negligible)
- Grid canvas rendering (only on resize/column change)
- Database save debouncing (already planned)


---

## Risk Mitigation (Updated)

### Risk 1: Breaking Existing Canvas ⚠️
**Mitigation:**
- ✅ Separate route (`/ledger` not `/canvas`)
- ✅ Minimal changes to shared code
- ✅ Extend types (don't replace)
- ✅ Keep canvas page as-is

### Risk 2: Type Conflicts
**Mitigation:**
- ✅ Make `cell_id` optional in `Stroke`
- ✅ Backward compatible (undefined = null)
- ✅ New types in separate namespace

### Risk 3: Cell Alignment Drift (Canvas vs HTML)
**Mitigation:**
- Use consistent measurement units (px)
- Test at multiple DPIs
- Add visual debugging mode if needed

### Risk 4: Data Migration Issues
**Mitigation:**
- ✅ Idempotent migration (safe to run multiple times)
- ✅ Backfill with safety checks
- ✅ Test on staging first
- ✅ Both content formats supported

---

## Implementation Timeline

### Phase 1: Foundation (Tasks 1-3)
**Estimated:** 2-3 days
- Database migration
- Type updates
- Canvas components

### Phase 2: Interaction (Tasks 4-5)
**Estimated:** 3-4 days
- Overlay components
- Route creation
- State management

### Phase 3: Features (Tasks 6-7)
**Estimated:** 2-3 days
- Cell binding
- Column management

### Phase 4: Quality (Task 8)
**Estimated:** 2-3 days
- Testing
- Documentation
- Polish

**Total Estimate:** 9-13 days

---

## File Structure Overview

```
Papyr/
├── supabase/
│   └── migrations/
│       └── 20260807000000_add_position_and_update_content_structure.sql ✅
├── src/
│   ├── app/
│   │   └── dashboard/
│   │       └── books/
│   │           └── [id]/
│   │               ├── canvas/
│   │               │   └── page.tsx (UNCHANGED)
│   │               └── ledger/
│   │                   └── page.tsx (NEW)
│   ├── components/
│   │   └── ledger-workspace/ (NEW)
│   │       ├── LedgerCanvas.tsx
│   │       ├── PaperLayer.tsx
│   │       ├── GridLayer.tsx
│   │       ├── InkLayer.tsx
│   │       ├── ColumnHeaders.tsx
│   │       ├── CellHighlights.tsx
│   │       ├── ColumnControls.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useInkEngine.ts (MINOR CHANGES)
│   │   └── useLedgerWorkspace.ts (NEW)
│   ├── lib/
│   │   └── ink-engine/ (UNCHANGED)
│   └── types/
│       └── ledger.ts (NEW)
└── LEDGER_WORKSPACE_IMPLEMENTATION_PLAN_REVISED.md (THIS FILE)
```


---

## Appendix A: Ink Engine Capabilities

Based on audit of existing codebase:

### Features Ready to Use
- ✅ Natural pressure tapering (velocity-based)
- ✅ Catmull-Rom smoothing
- ✅ Quadratic bezier rendering
- ✅ 5 pen sizes (extra-fine → marker)
- ✅ Color picker
- ✅ Undo/redo (full history stack)
- ✅ Offscreen canvas compositing
- ✅ Tail rendering optimization
- ✅ Pointer capture (multi-touch safe)
- ✅ Mobile responsiveness
- ✅ DPI awareness

### Performance Metrics (Validated)
- Latency: ~16ms (imperceptible)
- Frame Rate: 60-120 FPS
- Frame Time: ~4-6ms per frame
- Long strokes: Constant time (O(1) tail rendering)

### What We're Adding
- Cell binding metadata (cell_id field)
- Ledger-specific UI (grid, headers, highlights)
- Column management
- Default page initialization

### What We're NOT Changing
- Stroke rendering pipeline
- Pressure simulation
- Canvas optimization
- Pointer event handling

---

## Appendix B: Database Migration Details

**File:** `/supabase/migrations/20260807000000_add_position_and_update_content_structure.sql`

**What It Does:**
1. Adds `position` column (for page ordering)
2. Backfills from existing `page_number`
3. Creates index for performance
4. Adds helper function `create_default_ledger_page(book_id)`
5. Documents content structure

**Safety:**
- ✅ Idempotent (safe to run multiple times)
- ✅ Non-destructive (adds column, doesn't remove)
- ✅ Backward compatible (existing queries work)
- ✅ Uses `IF NOT EXISTS` checks

**Helper Function:**
```sql
create_default_ledger_page(book_id UUID) RETURNS UUID
```
Creates a page with:
- Default 4 columns: Date (120px), Description (280px), Debit (120px), Credit (120px)
- 20 empty rows
- Empty strokes array
- Correct position (next in sequence)

**Usage from TypeScript:**
```typescript
const { data } = await supabase
  .rpc('create_default_ledger_page', { p_book_id: bookId });
```

---

## Appendix C: Component API Reference

### LedgerCanvas
```typescript
interface LedgerCanvasProps {
  strokes: Stroke[];
  ledgerConfig: LedgerConfig;
  currentStroke?: RawPoint[];
  penConfig: PenConfig;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}
```

### ColumnHeaders
```typescript
interface ColumnHeadersProps {
  columns: LedgerColumn[];
  selectedColumn: number | null;
  onColumnSelect: (index: number) => void;
  onColumnEdit: (index: number, newLabel: string) => void;
  onColumnAdd: () => void;
  onColumnRemove: (index: number) => void;
}
```

### CellHighlights
```typescript
interface CellHighlightsProps {
  columns: LedgerColumn[];
  rowCount: number;
  selectedCell: CellCoordinates | null;
  onCellSelect: (coords: CellCoordinates | null) => void;
}
```

### useLedgerWorkspace
```typescript
interface UseLedgerWorkspaceReturn {
  // Ink engine (from useInkEngine)
  strokes: Stroke[];
  createStroke: (points: RawPoint[], cell_id?: string | null) => Stroke;
  addStroke: (stroke: Stroke) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Ledger state
  ledgerConfig: LedgerConfig;
  selectedCell: CellCoordinates | null;
  setSelectedCell: (coords: CellCoordinates | null) => void;
  
  // Column management
  addColumn: () => void;
  editColumn: (index: number, label: string) => void;
  removeColumn: (index: number) => void;
  
  // Persistence
  savePage: () => Promise<void>;
  isSaving: boolean;
}
```

---

## Next Steps

### Immediate Actions (Task 1)

1. **Apply Database Migration:**
   ```bash
   cd /Users/user/Ledger/Papyr
   # Connect to Supabase project
   # Run migration: 20260807000000_add_position_and_update_content_structure.sql
   ```

2. **Verify Migration:**
   ```sql
   -- Check position column exists
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'pages';
   
   -- Test helper function
   SELECT create_default_ledger_page('test-book-id');
   ```

3. **Move to Task 2:**
   - Update type definitions
   - Add `cell_id` to `Stroke` interface
   - Create `/src/types/ledger.ts`

---

## Questions & Decisions Needed

### Q1: Navigation Strategy
**Current:** Header has "Back to Books" + "Ledger" button  
**Proposed:** Add "Canvas" | "Ledger" toggle in header  
**Decision:** ✅ Approved in plan

### Q2: Legacy Content Migration
**Question:** Convert old `{strokes: [], tables: []}` to new format?  
**Decision:** Support both formats (check for `ledger` key)

### Q3: Cell ID Format
**Proposed:** `col-{columnIndex}-row-{rowIndex}`  
**Example:** `col-0-row-5`  
**Decision:** ✅ Approved (simple, parseable)

---

## Summary of Changes from Original Plan

1. ✅ Reduced from 10 tasks to 8 (reuse > rebuild)
2. ✅ No performance optimization task (already done)
3. ✅ Separate route strategy (no breaking changes)
4. ✅ Extended types (not replaced)
5. ✅ Migration simplified (position column only)
6. ✅ Clear backward compatibility strategy

**Ready to implement!** 🚀

