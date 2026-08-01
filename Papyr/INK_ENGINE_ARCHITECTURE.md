# Papyr Premium Ink Engine - Architecture & Design

## CURRENT STATE ANALYSIS

### What's Working
- ✅ Stroke capture (pointer events)
- ✅ Basic rendering pipeline
- ✅ Undo/redo functionality
- ✅ Mobile responsiveness

### Critical Issues (Root Causes)
1. **Mechanical appearance**: Using `getStroke()` from perfect-freehand creates uniform paths
2. **No pressure simulation**: Line width is constant (not velocity-responsive)
3. **SVG-like rendering**: Simple `lineTo` + `stroke` lacks organic tapering
4. **No natural variation**: Perfect smoothing removes handwriting personality
5. **Latency**: Heavy re-renders on every pointer event
6. **Architecture**: Rendering merged with state management (tight coupling)

---

## RECOMMENDED ARCHITECTURE

### Rendering Strategy: **Canvas2D + Custom Stroke Engine**

**Why NOT alternatives:**
- ❌ SVG: Too slow for 100k strokes, no efficient partial updates
- ❌ Konva: Bloated, designed for UI not ink
- ❌ WebGL: Overkill for current scope, steep complexity
- ❌ perfect-freehand alone: Too mechanical, uniform

**Why Canvas2D + Custom:**
- ✅ Native, performant, well-understood
- ✅ Full control over stroke rendering
- ✅ Can implement quadratic bezier tapering
- ✅ Natural pressure simulation possible
- ✅ Scales to 100k+ strokes with virtualization
- ✅ Can migrate to WebGL later if needed

---

## NEW RENDERING PIPELINE

### Phase 1: Stroke Capture
```
Pointer Event → Canvas Coordinates → StrokePoint
  ↓
Validate & Throttle (target 60-120 FPS)
  ↓
Store in memory (not DOM)
```

### Phase 2: Pressure Simulation (if no real pressure)
```
Raw Points → Calculate Velocity/Acceleration
  ↓
Simulate Pressure: velocity-based width
  ↓
Range: 0.5 (fast) to 1.0 (slow)
```

### Phase 3: Stroke Fitting
```
Raw Points → Apply Catmull-Rom smoothing (preserve handwriting)
  ↓
Fit to quadratic bezier curves
  ↓
Generate stroke outline with tapering
```

### Phase 4: Rendering
```
Stroke Outline → Render filled path
  ↓
Anti-aliased edges (ctx.imageSmoothingEnabled)
  ↓
Natural caps/joins (round)
```

---

## NEW STROKE DATA MODEL

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
  // Bezier control points
  p0: [number, number]; // start
  p1: [number, number]; // control1
  p2: [number, number]; // control2
  p3: [number, number]; // end
  
  // Width at start/end (for tapering)
  widthStart: number;
  widthEnd: number;
  
  // Pressure for rendering
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
  bounds: { minX, minY, maxX, maxY }; // for culling
}
```

---

## PEN SIZES (Physically Correct)

| Size | Canvas Width | Smoothing | Tapering |
|------|-------------|-----------|----------|
| Extra Fine | 0.8px | High | Sharp |
| Fine | 1.2px | High | Moderate |
| Medium | 1.8px | Medium | Natural |
| Bold | 2.8px | Low | Soft |
| Marker | 5.0px | Low | Very Soft |

Each size has unique smoothing and tapering to feel physically distinct.

---

## PRESSURE SIMULATION (When No Sensor Data)

### Velocity-Based Width
```
velocity = distance / timeDelta
normalizedVel = clamp(velocity / maxVelocity, 0, 1)
width = minWidth + (maxWidth - minWidth) * (1 - normalizedVel)
```

Fast strokes → thin lines
Slow strokes → thick lines
Natural and intuitive

### Acceleration-Based Tapering
```
acceleration = (currentVel - prevVel) / timeDelta
tapering = baseWidth * (1 - acceleration * factor)
```

Adds organic variation as user accelerates/decelerates

---

## STROKE RENDERING: QUADRATIC BEZIER TAPERING

Instead of uniform strokes:

```
// For each segment, create outline by:
1. Generate centerline (Catmull-Rom through points)
2. Calculate perpendicular offset at each point
3. Apply tapering: offset *= pressureAtPoint
4. Create filled polygon (top outline + bottom outline reversed)
```

Result: **Natural tapering at stroke ends**, no SVG look

---

## LATENCY OPTIMIZATION

### Real-time Rendering (<16ms target)
```
Pointer Event
  ↓
Add to buffer (O(1))
  ↓
Request AnimationFrame
  ↓
Render only new segment (not entire stroke) ← KEY OPTIMIZATION
  ↓
Display immediately
```

Never redraw entire canvas. Only render:
- Last segment of current stroke
- Previously rendered strokes (static)

### Pointer Coalescing
```
Browser may queue multiple pointer events
Coalesce into single frame: find intermediate points
Render smooth interpolation
```

---

## ARCHITECTURE COMPONENTS

### 1. Ink Engine (`src/lib/ink-engine/`)
```
InkEngine/
├── stroke-renderer.ts     // Bezier + tapering
├── pressure-simulator.ts  // Velocity-based width
├── stroke-buffer.ts       // Memory-efficient storage
├── renderer-pipeline.ts   // Canvas rendering
└── types.ts              // Data models
```

### 2. Hooks (`src/hooks/`)
```
useInkEngine()            // Main hook
useStrokeHistory()        // Undo/redo (updated)
usePressureSimulation()   // Velocity calculation
```

### 3. Canvas Component (`src/components/`)
```
PapyrCanvas/
├── PapyrCanvas.tsx       // Main component
├── useCanvasSetup.ts     // DPI awareness, resize
└── usePointerEvents.ts   // Event handling
```

---

## PERFORMANCE STRATEGY

### Memory
- Store raw points only (compressed)
- Generate segments on-demand
- Culling: Only render visible strokes (bounding boxes)

### Rendering
- Offscreen canvas for stroke rendering
- Composite to main canvas
- Minimize reflow/repaint

### Scaling
- Current: Support 10,000 strokes easily
- Future: Virtualization for 100k+
  - Render window: only visible region
  - Stream strokes from IndexedDB
  - Lazy segment generation

---

## ERASER ARCHITECTURE (Design Only)

### Approaches

1. **Stroke Eraser** (Simple)
   - Full stroke removal
   - Fast, clean
   - No partial erasure

2. **Point Eraser** (Better)
   - Erase within radius
   - Split stroke into segments
   - Keep non-erased parts
   - More natural

3. **Partial Eraser** (Best)
   - Erase overlapping region
   - Regenerate affected segments
   - Smooth transitions
   - Scalable architecture

**Recommendation**: Implement Point Eraser now, design for Partial Eraser future

---

## TESTING STRATEGY

### Unit Tests
- Pressure simulation math
- Bezier curve generation
- Point interpolation

### Integration Tests
- Real-time rendering with throttling
- Undo/redo with new data model
- Canvas at different DPIs

### Benchmarks
- Stroke rendering: <5ms per segment
- Full stroke: <50ms
- 100 concurrent strokes: <16ms frame time

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Next Sprint)
- [ ] Ink engine architecture
- [ ] Pressure simulation
- [ ] Bezier stroke rendering
- [ ] Replace current rendering

### Phase 2: Quality
- [ ] Multiple pen sizes
- [ ] Advanced smoothing (Catmull-Rom)
- [ ] Natural tapering
- [ ] Pressure normalization

### Phase 3: Performance
- [ ] Offscreen canvas optimization
- [ ] Stroke culling/clipping
- [ ] Memory profiling
- [ ] Benchmark suite

### Phase 4: Features
- [ ] Eraser (point-based)
- [ ] Stroke colors
- [ ] Undo/redo optimization
- [ ] Zoom support

---

## SUCCESS METRICS

After implementation, the ink should:
- ✅ Feel alive and responsive
- ✅ Show natural pressure variation
- ✅ Have organic tapering (no SVG look)
- ✅ Support 10k+ strokes smoothly
- ✅ Render in <16ms per frame
- ✅ Look like GoodNotes/Notability quality

**User Test**: Someone familiar with premium note apps should say: _"This feels like writing on paper."_

---

## CODE QUALITY STANDARDS

- Strong TypeScript (no `any`)
- Comprehensive JSDoc comments
- Reusable, composable functions
- Clean separation of concerns
- Production-ready (no hacks)
- Benchmarks for all hot paths
