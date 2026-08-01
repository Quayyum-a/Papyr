# Sprint 1: UI Toolbar & Tool Selection

## Sprint Goal
Implement a professional toolbar with pen and eraser tool selection, allowing users to switch between drawing tools and customize stroke properties.

## Prerequisites
- [x] Sprint 0 complete: Basic canvas drawing functional
- [x] Canvas coordinates fixed (pointer events working correctly)
- [x] Icon assets created (pen.svg, eraser.svg, etc.)
- [x] Undo/redo state management fixed

## Deliverables
- [ ] Toolbar UI component with tool buttons (pen, eraser, color picker)
- [ ] Tool selection state management (active tool tracking)
- [ ] Pen tool with stroke color selection
- [ ] Eraser tool implementation with canvas clearing logic
- [ ] Stroke width/size slider
- [ ] Clear canvas button
- [ ] Keyboard shortcuts documentation
- [ ] Unit tests for tool switching
- [ ] E2E test for drawing with different tools

## Technical Requirements

### Toolbar Component
- Location: Fixed at top-right or bottom of canvas
- Icons: Use SVG icons from `/public/icons/`
- Active state: Visual indicator of selected tool
- Accessibility: ARIA labels, keyboard navigation

### Tool Implementations
1. **Pen Tool** (default):
   - Color picker (start with black, allow customization)
   - Stroke width slider (0.5 - 5.0 px)
   - Pressure sensitivity toggle

2. **Eraser Tool**:
   - Clear selected strokes or full canvas
   - Visual feedback (different cursor)
   - Undo/redo support

### State Management
```typescript
interface ToolState {
  activeTool: 'pen' | 'eraser';
  penColor: string;
  penWidth: number;
  usePressure: boolean;
}
```

### Testing Requirements
- Unit tests: Tool switching, state updates
- Integration tests: Drawing with different tools
- E2E tests: Full user flow (draw → switch tool → draw)

## Out of Scope
- Shape drawing (rectangles, circles, etc.)
- Text tool
- Advanced color picker (stick with HTML color input)
- Tool presets/profiles
- Animation or tool transitions

## Risks
1. **Performance impact of toolbar**: Ensure re-renders don't affect drawing smoothness
   - Mitigation: Memoize toolbar components, separate state management
2. **Tool switching during active stroke**: Edge case handling needed
   - Mitigation: Complete current stroke before switching tools

## Success Criteria
- [ ] Users can select pen or eraser from toolbar
- [ ] Pen draws with selected color and width
- [ ] Eraser removes strokes without affecting other strokes
- [ ] Undo/redo works with all tools
- [ ] No lag or stuttering when switching tools
- [ ] Toolbar is mobile-responsive
- [ ] All tests pass (unit, integration, E2E)

## Definition of Done
- Code reviewed and approved
- All tests passing (100% coverage on new code)
- PR merged to main
- Staging deployment successful
- Product owner sign-off
- Documentation updated

## Story Points: 8
Estimated Sprint Duration: 1 week
