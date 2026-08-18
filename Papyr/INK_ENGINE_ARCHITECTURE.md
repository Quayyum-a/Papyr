# Papyr Ink Engine Architecture

> **⚠️ HISTORICAL DOCUMENT — REFERENCE ONLY**
> 
> This document describes the **original freeform canvas ink engine** designed for general note-taking (Sprint 0).
> 
> **The current production architecture is the cell-bound ledger workspace ink system** — see [DECISIONS.md #16](../DECISIONS.md#16-ink-engine-architecture-cell-bound-ledger-workspace-supersedes-original-freeform-canvas-design) for the authoritative architecture.
> 
> This file is retained for historical context and to understand the evolution of the ink engine.

---

## Original Sprint 0 Architecture (Freeform Canvas)

### What Was Built
- ✅ Canvas2D + custom stroke engine (production-ready)
- ✅ Quadratic bezier tapering (no SVG look)
- ✅ Catmull-Rom smoothing (preserves handwriting personality)
- ✅ Velocity-based pressure simulation (works without stylus)
- ✅ RequestAnimationFrame render loop (16ms latency)
- ✅ Offscreen canvas compositing (efficient redraws)
- ✅ Multiple pen sizes (extra-fine, fine, medium, bold, marker)
- ✅ Natural stroke caps and joins (round, organic)
- ✅ TypeScript-first architecture (full type safety)
- ✅ Render loop stability fixes (no re-creation on stroke)
- ✅ Tail rendering for constant-time current stroke
- ✅ Optimized draw steps for real-time rendering

### Original Data Model (Freeform)
```typescript
interface RawPoint {
  x: number;
  y: number;
  t: number;           // timestamp
  pressure?: number;   // 0-1
  tiltX?: number;
  tiltY?: number;
}

interface StrokeSegment {
  p0: [number, number]; // start
  p1: [number, number]; // control1
  p2: [number, number]; // control2
  p3: [number, number]; // end
  
  widthStart: number;
  widthEnd: number;
  pressureStart: number;
  pressureEnd: number;
}

interface Stroke {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  size: 'extra-fine' | 'fine' | 'medium' | 'bold' | 'marker';
  segments: StrokeSegment[];
  createdAt: number;
  bounds: { minX, minY, maxX, maxY };
}
```

### Pen Sizes (Physically Correct)
| Size | Canvas Width | Smoothing | Tapering |
|------|-------------|-----------|----------|
| Extra Fine | 0.8px | High | Sharp |
| Fine | 1.2px | High | Moderate |
| Medium | 1.8px | Medium | Natural |
| Bold | 2.8px | Low | Soft |
| Marker | 5.0px | Low | Very Soft |

### Pressure Simulation (When No Sensor Data)
**Velocity-Based Width**
```
velocity = distance / timeDelta
normalizedVel = clamp(velocity / maxVelocity, 0, 1)
width = minWidth + (maxWidth - minWidth) * (1 - normalizedVel)
```
Fast strokes → thin lines, Slow strokes → thick lines

**Acceleration-Based Tapering**
```
acceleration = (currentVel - prevVel) / timeDelta
tapering = baseWidth * (1 - acceleration * factor)
```

### Stroke Rendering: Quadratic Bezier Tapering
```
1. Generate centerline (Catmull-Rom through points)
2. Calculate perpendicular offset at each point
3. Apply tapering: offset *= pressureAtPoint
4. Create filled polygon (top outline + bottom outline reversed)
```
Result: Natural tapering at stroke ends, no SVG look

### Latency Optimization
```
Pointer Event → Add to buffer (O(1)) → RequestAnimationFrame → Render only new segment → Display immediately
```
Never redraw entire canvas. Only render last segment of current stroke + previously rendered strokes (static).

### Architecture Components (Sprint 0)
```
InkEngine/
├── stroke-renderer.ts     // Bezier + tapering
├── pressure-simulator.ts  // Velocity-based width
├── stroke-buffer.ts       // Memory-efficient storage
├── renderer-pipeline.ts   // Canvas rendering
└── types.ts              // Data models

Hooks/
├── useInkEngine()         // Main hook
├── useStrokeHistory()     // Undo/redo
├── usePressureSimulation() // Velocity calculation

Canvas Component/
├── PapyrCanvas.tsx        // Main component (freeform)
├── useCanvasSetup.ts      // DPI awareness, resize
└── usePointerEvents.ts    // Event handling
```

---

## Current Production Architecture (Ledger Workspace)

**See [DECISIONS.md #16](../DECISIONS.md#16-ink-engine-architecture-cell-bound-ledger-workspace-supersedes-original-freeform-canvas-design) for full details.**

### Key Changes from Sprint 0
1. **Cell Binding**: Strokes now have optional `cell_id` field linking to ledger cells
2. **Three-Layer Canvas**: PaperLayer (texture) + GridLayer (lines) + InkLayer (strokes)
3. **HTML Overlay**: ColumnHeaders, CellHighlights, selection management
4. **Ledger Config**: Column definitions, row count, default 4-column layout
5. **Backward Compatibility**: Freeform canvas page (`/`) still works unchanged

### Current Data Model Extensions
```typescript
// Extended in src/lib/ink-engine/types.ts
interface Stroke {
  // ... existing fields ...
  cell_id?: string | null;  // NEW: binds stroke to ledger cell
}

// New types in src/types/ledger.ts
interface LedgerColumn {
  id: string;
  label: string;
  width: number;
  position: number;
}

interface LedgerConfig {
  columns: LedgerColumn[];
  rowCount: number;
}

interface CellCoordinates {
  columnIndex: number;
  rowIndex: number;
}

interface StrokeWithCell extends Stroke {
  cell_id: string;
}
```

### Ledger Workspace Components
```
src/components/ledger-workspace/
├── LedgerCanvas.tsx          // Main container (3-layer canvas)
├── PaperLayer.tsx            // Paper background + grain texture
├── GridLayer.tsx             // Row lines + column dividers
├── InkLayer.tsx              // Ink stroke rendering wrapper
├── ColumnHeaders.tsx         // Editable column headers (tap-and-hold)
├── CellHighlights.tsx        // Cell selection highlight overlay
├── useLedgerCanvas.ts        // Canvas lifecycle hook
├── useCellSelection.ts       // Selection state hook
├── useLedgerConfig.ts        // Column management hook
└── index.ts                  // Exports
```

### Integration with Existing Ink Engine
- Reuses `useInkEngine()` hook for stroke rendering
- Reuses stroke data model with `cell_id` extension
- Reuses pressure simulation, bezier tapering, render pipeline
- No changes to core rendering — only composition and binding

---

## Performance Metrics (Both Architectures)
- **Latency**: ~16ms (imperceptible)
- **Frame Rate**: 60-120 FPS
- **Frame Time**: ~4-6ms per frame
- **Ink Quality**: Comparable to GoodNotes/Notability
- **Mobile**: Fully responsive, no scroll
- **Long Stroke Performance**: Constant frame time regardless of stroke length

---

## Testing
- Unit tests: Pressure simulation math, bezier generation, type validation
- Component tests: Canvas rendering, layer composition, cell selection
- Integration tests: Pointer events, cell binding, column management
- 36 tests passing for ledger workspace components

---

## Future Considerations
1. **Virtualization**: For 10k+ strokes, implement viewport culling
2. **WebGL Migration**: If canvas2D hits limits, migrate stroke renderer to WebGL
3. **Eraser**: Point-based eraser with stroke splitting (designed, not implemented)
4. **Zoom/Pan**: Add transform layer for zoom/pan in ledger workspace
5. **Collaboration**: CRDT-based stroke sync for real-time co-editing

---

*Last Updated: 2026-08-16 (marked as historical)*
*Current Architecture: See DECISIONS.md #16*