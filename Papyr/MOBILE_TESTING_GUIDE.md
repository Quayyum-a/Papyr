# Papyr Mobile Ledger Workspace - Testing Guide

## Testing Overview

This guide provides comprehensive testing procedures for the mobile-optimized Papyr ledger workspace. The implementation focuses on iPhone/Android touch interactions, scrollable canvas, responsive UI, and accurate handwriting capture.

## Test Environment Requirements

### Recommended Devices
- **iPhone**: Safari on iPhone 12/13/14 (375×812, 390×844, 393×852)
- **Android**: Chrome on Pixel/Samsung (360×800, 412×915)
- **iPad**: Safari in portrait and landscape
- **Desktop**: Chrome/Safari for regression testing

### Test URLs
- Development: `http://localhost:3000/dashboard/books/[book-id]`
- Staging: Your Vercel preview URL
- Production: Your production domain

## Pre-Test Checklist

- [ ] Build passes: `npm run build`
- [ ] No TypeScript errors: `npm run lint`
- [ ] User authenticated with test account
- [ ] At least one book created
- [ ] Book contains at least one page

---

## Test Suite 1: Mobile UI/Layout

### Test 1.1: Header Responsiveness
**Viewport**: 375px width (iPhone SE)

**Steps**:
1. Open book ledger page on mobile
2. Observe header layout

**Expected Results**:
- ✅ Header height: ~56px (h-14)
- ✅ Back button visible and tappable
- ✅ Book title truncates with ellipsis if too long
- ✅ Logo hidden on mobile (shows on tablet+)
- ✅ Profile icon visible and tappable
- ✅ No horizontal overflow
- ✅ All tap targets ≥44px

**Pass Criteria**: All header elements accessible without horizontal scroll

---

### Test 1.2: Mobile Toolbar - Closed State
**Viewport**: 375px width

**Steps**:
1. Scroll to view ledger workspace
2. Locate floating action button (FAB)

**Expected Results**:
- ✅ Circular FAB in bottom-right corner
- ✅ Dark background (slate-900)
- ✅ Pen icon visible
- ✅ Does not obstruct ledger content
- ✅ FAB positioned 16px from right/bottom edges
- ✅ Desktop toolbar NOT visible (hidden on mobile)

**Pass Criteria**: FAB visible, non-intrusive, clearly actionable

---

### Test 1.3: Mobile Toolbar - Open State
**Viewport**: 375px width

**Steps**:
1. Tap the floating action button
2. Observe expanded toolbar panel

**Expected Results**:
- ✅ Rounded panel appears (min-width: 280px)
- ✅ Contains: Undo, Redo buttons
- ✅ Contains: Pen size dropdown (5 options)
- ✅ Contains: Color picker with hex display
- ✅ Contains: Status info (strokes, columns, selected cell)
- ✅ "Tools" header with close button (chevron left)
- ✅ Panel doesn't overflow viewport
- ✅ Can close by tapping chevron

**Pass Criteria**: All controls accessible, readable, tappable

---

### Test 1.4: Ledger Canvas Dimensions
**Viewport**: 375px width

**Steps**:
1. Open book ledger
2. Observe ledger grid dimensions

**Expected Results**:
- ✅ Ledger maintains natural column widths (not squished)
- ✅ Default 4 columns visible: Date (120px), Description (280px), Debit (120px), Credit (120px)
- ✅ Total ledger width: ~640px (exceeds viewport)
- ✅ Horizontal scroll enabled
- ✅ Vertical scroll enabled
- ✅ No desktop toolbar space reserved on mobile

**Pass Criteria**: Natural ledger proportions preserved, scrollable

---

## Test Suite 2: Scrolling Behavior

### Test 2.1: Horizontal Scrolling
**Viewport**: 375px width

**Steps**:
1. Place finger on ledger (outside any selected cell)
2. Swipe left to scroll right
3. Swipe right to scroll left

**Expected Results**:
- ✅ Ledger scrolls horizontally smoothly
- ✅ Can reach rightmost column (Credit)
- ✅ Scroll momentum feels natural (iOS/Android native feel)
- ✅ No accidental drawing while scrolling
- ✅ Column headers remain in sync
- ✅ Cell highlights remain aligned

**Pass Criteria**: Smooth horizontal scrolling without triggering drawing

---

### Test 2.2: Vertical Scrolling
**Viewport**: 375px width

**Steps**:
1. Place finger on ledger
2. Swipe up to scroll down through rows
3. Swipe down to scroll up

**Expected Results**:
- ✅ Ledger scrolls vertically smoothly
- ✅ Can reach row 20 (default row count)
- ✅ Scroll momentum feels natural
- ✅ No accidental drawing while scrolling
- ✅ Grid lines remain aligned

**Pass Criteria**: Smooth vertical scrolling without triggering drawing

---

### Test 2.3: Two-Finger Pinch/Zoom
**Viewport**: Any mobile device

**Steps**:
1. Place two fingers on ledger
2. Attempt to pinch to zoom

**Expected Results**:
- ✅ Browser default zoom behavior works OR
- ✅ Pinch-zoom is intentionally disabled (acceptable)

**Pass Criteria**: Predictable zoom behavior (either works or clearly disabled)

---

## Test Suite 3: Cell Selection

### Test 3.1: Select Cell via Tap
**Viewport**: 375px width

**Steps**:
1. Tap on a cell in Description column, row 1
2. Observe visual feedback

**Expected Results**:
- ✅ Cell background changes to yellow (pale yellow-50)
- ✅ Subtle yellow border appears around cell
- ✅ Expanded writing zone appears (dashed border)
- ✅ Mobile toolbar shows selected cell coordinates
- ✅ Cell remains selected (doesn't immediately deselect)

**Pass Criteria**: Clear visual indication of selected cell

---

### Test 3.2: Selected Cell Persists During Scroll
**Viewport**: 375px width

**Steps**:
1. Select a cell (e.g., Description, row 1)
2. Scroll horizontally to view other columns
3. Scroll back to original column
4. Scroll vertically down several rows
5. Scroll back to row 1

**Expected Results**:
- ✅ Selected cell remains highlighted during scroll
- ✅ Cell coordinates in toolbar don't change
- ✅ Can return to selected cell visually
- ✅ Writing zone indicator remains on selected cell

**Pass Criteria**: Selected cell state persists across scrolling

---

### Test 3.3: Deselect Cell
**Viewport**: 375px width

**Steps**:
1. Select a cell
2. Tap the SAME cell again

**Expected Results**:
- ✅ Cell selection clears
- ✅ Yellow highlight disappears
- ✅ Expanded writing zone indicator disappears
- ✅ Toolbar no longer shows selected cell coordinates

**Pass Criteria**: Toggle behavior works (select/deselect same cell)

---

### Test 3.4: Switch Selected Cell
**Viewport**: 375px width

**Steps**:
1. Select cell A (Description, row 1)
2. Tap cell B (Debit, row 3)

**Expected Results**:
- ✅ Cell A deselects
- ✅ Cell B becomes selected
- ✅ Visual indicators move to cell B
- ✅ Toolbar updates to show cell B coordinates

**Pass Criteria**: Only one cell selected at a time

---

## Test Suite 4: Handwriting Capture

### Test 4.1: Write in Selected Cell
**Viewport**: 375px width, iPhone Safari

**Steps**:
1. Select Description cell, row 1
2. Using finger or stylus, write "John" in the cell
3. Lift finger/stylus

**Expected Results**:
- ✅ Ink appears immediately under finger/stylus (no lag)
- ✅ Stroke follows finger movement smoothly
- ✅ Stroke appears natural (not blocky/pixelated)
- ✅ Stroke remains visible after lifting finger
- ✅ Stroke stays within selected cell boundaries
- ✅ Stroke count in toolbar increments

**Pass Criteria**: Responsive, natural handwriting capture

---

### Test 4.2: Fast Handwriting
**Viewport**: 375px width

**Steps**:
1. Select Description cell
2. Write "John" quickly (connected letters)
3. Write "25000" quickly with no pauses

**Expected Results**:
- ✅ All stroke points captured (no gaps)
- ✅ Connected strokes appear smooth
- ✅ No "line segments" appearance (should be curved)
- ✅ Writing feels responsive (<16ms latency perceived)

**Pass Criteria**: Fast writing captured accurately

---

### Test 4.3: Write Multiple Strokes in One Cell
**Viewport**: 375px width

**Steps**:
1. Select Description cell
2. Write "J" (lift finger)
3. Write "o" (lift finger)
4. Write "h" (lift finger)
5. Write "n" (lift finger)

**Expected Results**:
- ✅ All 4 strokes remain visible
- ✅ All strokes belong to same cell
- ✅ Stroke count shows 4+ strokes

**Pass Criteria**: Multiple strokes accumulate in selected cell

---

### Test 4.4: Write in Different Cells
**Viewport**: 375px width

**Steps**:
1. Select Description cell, row 1
2. Write "John"
3. Select Debit cell, row 1
4. Write "25000"
5. Select Credit cell, row 1
6. Write "Paid"

**Expected Results**:
- ✅ Each stroke set stays in its respective cell
- ✅ No strokes overlap between cells
- ✅ All strokes persist when cells are deselected

**Pass Criteria**: Strokes correctly bound to their cells

---

### Test 4.5: Coordinate Accuracy During Scroll
**Viewport**: 375px width

**Steps**:
1. Scroll ledger horizontally right
2. Select Credit column cell
3. Write "Paid"
4. Scroll ledger back left
5. Scroll ledger vertically down
6. Select Description cell, row 10
7. Write "Repair"

**Expected Results**:
- ✅ "Paid" appears in correct cell (Credit)
- ✅ "Paid" does not drift to other cells
- ✅ "Repair" appears in correct cell (Description, row 10)
- ✅ Both strokes maintain position during scroll

**Pass Criteria**: Handwriting coordinates accurate regardless of scroll position

---

## Test Suite 5: Touch vs Draw Gestures

### Test 5.1: Scroll When No Cell Selected
**Viewport**: 375px width

**Steps**:
1. Ensure NO cell is selected
2. Touch and drag on ledger

**Expected Results**:
- ✅ Ledger scrolls (does NOT draw)
- ✅ No ink strokes created
- ✅ Scrolling feels like native app

**Pass Criteria**: Touch gestures scroll when no cell selected

---

### Test 5.2: Draw When Cell Selected (Inside Cell)
**Viewport**: 375px width

**Steps**:
1. Select a cell
2. Touch inside selected cell boundaries
3. Drag to draw

**Expected Results**:
- ✅ Drawing occurs (does NOT scroll)
- ✅ Ink appears under finger
- ✅ `touch-action: none` prevents scroll in selected cell

**Pass Criteria**: Drawing works inside selected cell

---

### Test 5.3: Scroll When Cell Selected (Outside Cell)
**Viewport**: 375px width

**Steps**:
1. Select Description cell, row 1
2. Touch and drag OUTSIDE selected cell area

**Expected Results**:
- ✅ Ledger scrolls
- ✅ No ink strokes created
- ✅ Selected cell remains selected

**Pass Criteria**: Can scroll ledger even with cell selected (by dragging outside cell)

---

## Test Suite 6: Persistence & Data Integrity

### Test 6.1: Handwriting Persists on Refresh
**Viewport**: 375px width

**Steps**:
1. Select Description cell
2. Write "John"
3. Wait 2 seconds (debounce save)
4. Refresh browser page
5. Observe Description cell

**Expected Results**:
- ✅ "John" remains visible in Description cell
- ✅ Stroke position accurate
- ✅ No data loss

**Pass Criteria**: Handwriting survives page refresh

---

### Test 6.2: Multiple Cell Persistence
**Viewport**: 375px width

**Steps**:
1. Write in 3 different cells:
   - Description: "John"
   - Debit: "25000"
   - Credit: "Paid"
2. Wait 2 seconds
3. Refresh page
4. Check all 3 cells

**Expected Results**:
- ✅ All 3 cells retain their strokes
- ✅ Strokes appear in correct cells (no mixing)

**Pass Criteria**: Multi-cell handwriting persists correctly

---

### Test 6.3: Cell Association After Scroll
**Viewport**: 375px width

**Steps**:
1. Scroll to Credit column (far right)
2. Select Credit cell, row 5
3. Write "₦1000"
4. Scroll left, then right again
5. Observe Credit cell, row 5

**Expected Results**:
- ✅ "₦1000" remains in Credit cell, row 5
- ✅ Stroke does not drift to neighboring cells

**Pass Criteria**: Cell-stroke binding robust during scrolling

---

## Test Suite 7: Toolbar Functionality

### Test 7.1: Undo Stroke
**Viewport**: 375px width

**Steps**:
1. Select a cell
2. Write "John"
3. Open mobile toolbar
4. Tap "Undo" button

**Expected Results**:
- ✅ Last stroke disappears
- ✅ Undo button enables/disables appropriately
- ✅ Stroke count decrements

**Pass Criteria**: Undo removes last stroke

---

### Test 7.2: Redo Stroke
**Viewport**: 375px width

**Steps**:
1. Write "John"
2. Undo (stroke disappears)
3. Open toolbar
4. Tap "Redo"

**Expected Results**:
- ✅ Stroke reappears
- ✅ Redo button enables/disables appropriately

**Pass Criteria**: Redo restores undone stroke

---

### Test 7.3: Change Pen Size
**Viewport**: 375px width

**Steps**:
1. Open toolbar
2. Change pen size from "Medium" to "Fine"
3. Close toolbar
4. Select cell and write "Test"
5. Change to "Bold"
6. Write "Test" again

**Expected Results**:
- ✅ First "Test" appears fine
- ✅ Second "Test" appears bold/thicker
- ✅ Pen size persists between toolbar open/close

**Pass Criteria**: Pen size changes affect new strokes

---

### Test 7.4: Change Pen Color
**Viewport**: 375px width

**Steps**:
1. Open toolbar
2. Tap color picker, select red (#FF0000)
3. Close toolbar
4. Write "Red"
5. Open toolbar, select blue (#0000FF)
6. Write "Blue"

**Expected Results**:
- ✅ "Red" appears in red
- ✅ "Blue" appears in blue
- ✅ Color persists across toolbar sessions

**Pass Criteria**: Color picker works correctly

---

## Test Suite 8: Orientation Changes

### Test 8.1: Portrait to Landscape
**Viewport**: iPhone (any size)

**Steps**:
1. Write "John" in Description cell (portrait)
2. Rotate device to landscape
3. Observe ledger

**Expected Results**:
- ✅ "John" remains in correct cell
- ✅ Canvas resizes correctly
- ✅ More columns visible in landscape
- ✅ No visual glitches
- ✅ Can continue writing

**Pass Criteria**: Graceful orientation change handling

---

### Test 8.2: Landscape to Portrait
**Viewport**: iPhone (any size)

**Steps**:
1. Write "Test" in landscape
2. Rotate to portrait
3. Observe ledger

**Expected Results**:
- ✅ "Test" remains in correct cell
- ✅ Fewer columns visible (as expected)
- ✅ Vertical scroll still works
- ✅ Horizontal scroll still works

**Pass Criteria**: Orientation change doesn't corrupt data

---

## Test Suite 9: Edge Cases

### Test 9.1: Very Long Book Title
**Test Data**: Book title = "My Very Long Business Ledger Name That Should Truncate Properly"

**Steps**:
1. Create book with long title
2. Open book on mobile (375px)
3. Observe header

**Expected Results**:
- ✅ Title truncates with ellipsis
- ✅ Profile icon remains visible
- ✅ No horizontal overflow

**Pass Criteria**: Long titles don't break layout

---

### Test 9.2: Write Near Cell Boundaries
**Viewport**: 375px width

**Steps**:
1. Select Description cell
2. Write stroke that extends close to right edge
3. Write stroke that extends close to bottom edge

**Expected Results**:
- ✅ Strokes clip at cell boundaries OR
- ✅ Strokes clip at expanded writing zone boundaries
- ✅ Strokes don't spill into adjacent cells visibly

**Pass Criteria**: Boundary clipping works correctly

---

### Test 9.3: Rapid Cell Switching
**Viewport**: 375px width

**Steps**:
1. Tap cell A
2. Immediately tap cell B
3. Immediately tap cell C
4. Write in cell C

**Expected Results**:
- ✅ Only cell C is selected
- ✅ Writing goes into cell C
- ✅ No race conditions or errors

**Pass Criteria**: Rapid selections handled gracefully

---

### Test 9.4: Write During Scroll (Edge Case)
**Viewport**: 375px width

**Steps**:
1. Select a cell
2. Start writing
3. While drawing, attempt to scroll with other finger

**Expected Results**:
- ✅ Drawing continues OR
- ✅ Scroll is prevented while drawing OR
- ✅ Drawing completes, then scroll happens
- ❌ Should NOT: draw and scroll simultaneously (corrupts coordinates)

**Pass Criteria**: One gesture at a time (no simultaneous draw+scroll)

---

### Test 9.5: Background App → Foreground
**Viewport**: iPhone Safari

**Steps**:
1. Write "John" in a cell
2. Switch to home screen (app backgrounds)
3. Wait 5 seconds
4. Return to Safari/Papyr

**Expected Results**:
- ✅ "John" still visible
- ✅ Selected cell still selected
- ✅ Can continue writing immediately

**Pass Criteria**: App state preserved during backgrounding

---

## Test Suite 10: Performance

### Test 10.1: Handwriting Latency
**Viewport**: 375px width

**Steps**:
1. Select a cell
2. Draw continuous line across cell
3. Observe perceived latency

**Expected Results**:
- ✅ Ink appears to follow finger in real-time
- ✅ No noticeable lag (subjective: <50ms perceived)
- ✅ No stuttering or frame drops

**Pass Criteria**: Handwriting feels immediate and responsive

---

### Test 10.2: Scroll Performance with Many Strokes
**Test Setup**: Create 50+ strokes across multiple cells

**Steps**:
1. Add handwriting to 10+ different cells
2. Scroll horizontally and vertically
3. Observe scroll smoothness

**Expected Results**:
- ✅ Scrolling remains smooth (60fps feel)
- ✅ No visible lag when rendering strokes
- ✅ Canvas redraws efficiently

**Pass Criteria**: Performance doesn't degrade with many strokes

---

### Test 10.3: Toolbar Animation Performance
**Viewport**: 375px width

**Steps**:
1. Open mobile toolbar (FAB → panel)
2. Close toolbar
3. Repeat 5 times rapidly

**Expected Results**:
- ✅ Panel animation smooth (no jank)
- ✅ No visual artifacts
- ✅ Can't break UI with rapid open/close

**Pass Criteria**: UI animations perform well

---

## Test Suite 11: Cross-Device

### Test 11.1: Desktop → Mobile Handoff
**Devices**: Desktop + Mobile (same account)

**Steps**:
1. On desktop: write "Desktop" in Description cell
2. Save/sync (wait 3 seconds)
3. On mobile: refresh page
4. Observe Description cell

**Expected Results**:
- ✅ "Desktop" appears on mobile
- ✅ Stroke rendering looks correct
- ✅ Cell binding maintained

**Pass Criteria**: Desktop handwriting visible on mobile

---

### Test 11.2: Mobile → Desktop Handoff
**Devices**: Mobile + Desktop (same account)

**Steps**:
1. On mobile: write "Mobile" in Debit cell
2. Wait for auto-save
3. On desktop: refresh page
4. Observe Debit cell

**Expected Results**:
- ✅ "Mobile" appears on desktop
- ✅ Stroke coordinates correct

**Pass Criteria**: Mobile handwriting visible on desktop

---

## Test Suite 12: Accessibility

### Test 12.1: Screen Reader (VoiceOver/TalkBack)
**Device**: iPhone with VoiceOver enabled

**Steps**:
1. Open book page
2. Swipe through elements
3. Listen to announcements

**Expected Results**:
- ✅ Header elements announced correctly
- ✅ "Ledger workspace" region announced
- ✅ Toolbar button announced as "Open toolbar"
- ✅ Selected cell announced with column/row info

**Pass Criteria**: Core navigation accessible via screen reader

---

### Test 12.2: Touch Target Sizes
**Viewport**: 375px width

**Steps**:
1. Measure tap targets (browser dev tools or visually)

**Expected Results**:
- ✅ All buttons ≥44×44px (iOS standard)
- ✅ FAB: 56×56px (clearly tappable)
- ✅ Toolbar buttons: ≥48×48px
- ✅ Cell tap areas: full cell height (44px)

**Pass Criteria**: All interactive elements meet minimum touch target size

---

## Test Suite 13: Browser Compatibility

### Test 13.1: iOS Safari
**Device**: iPhone 13/14 with latest iOS

- [ ] All test suites pass
- [ ] No iOS-specific bugs
- [ ] Scrolling feels native
- [ ] Touch gestures work correctly

---

### Test 13.2: Android Chrome
**Device**: Pixel/Samsung with Android 12+

- [ ] All test suites pass
- [ ] No Android-specific bugs
- [ ] Scrolling feels native
- [ ] Touch gestures work correctly

---

### Test 13.3: Desktop Regression
**Browser**: Chrome/Safari desktop

- [ ] Desktop toolbar still works (vertical sidebar)
- [ ] Mouse interactions work
- [ ] Hover states work
- [ ] No mobile UI appears on desktop

---

## Known Limitations & Expected Behaviors

### Acceptable Behaviors
1. **Pinch-zoom may be disabled**: This is intentional to prevent accidental zoom during writing
2. **Touch-action changes**: When cell is selected, scrolling may feel different (expected)
3. **Toolbar auto-close**: Mobile toolbar may auto-close after pen selection (design decision)

### Not Yet Implemented
1. **Palm rejection**: Native OS-level only (no custom implementation)
2. **Eraser tool**: Not yet implemented (future feature)
3. **Multi-page navigation**: Currently single-page only
4. **Offline mode**: Requires network for save (planned enhancement)

---

## Bug Reporting Template

When reporting issues, please include:

```
**Device**: iPhone 14 Pro / Pixel 7
**OS**: iOS 17.2 / Android 13
**Browser**: Safari 17 / Chrome 120
**Viewport**: 393×852
**Test Case**: Test 4.5 - Coordinate Accuracy During Scroll
**Expected**: Stroke appears in correct cell
**Actual**: Stroke drifted 20px to the right
**Steps to Reproduce**: 
1. [detailed steps]
**Screenshot**: [if applicable]
```

---

## Success Criteria Summary

The implementation is considered successful when:

✅ **All 13 test suites pass** with no critical failures
✅ **Handwriting feels natural** on iPhone Safari (primary target)
✅ **Scrolling works intuitively** (two-finger or drag-outside-cell)
✅ **Cell selection is clear** and persistent across scrolling
✅ **Coordinates are accurate** regardless of scroll position
✅ **Mobile UI is non-intrusive** (compact toolbar, responsive header)
✅ **Data persists correctly** across page refreshes
✅ **Desktop experience unaffected** (regression-free)

---

## Test Execution Log

Use this section to track your testing progress:

```
[ ] Test Suite 1: Mobile UI/Layout (8 tests)
[ ] Test Suite 2: Scrolling Behavior (3 tests)
[ ] Test Suite 3: Cell Selection (4 tests)
[ ] Test Suite 4: Handwriting Capture (5 tests)
[ ] Test Suite 5: Touch vs Draw Gestures (3 tests)
[ ] Test Suite 6: Persistence & Data Integrity (3 tests)
[ ] Test Suite 7: Toolbar Functionality (4 tests)
[ ] Test Suite 8: Orientation Changes (2 tests)
[ ] Test Suite 9: Edge Cases (5 tests)
[ ] Test Suite 10: Performance (3 tests)
[ ] Test Suite 11: Cross-Device (2 tests)
[ ] Test Suite 12: Accessibility (2 tests)
[ ] Test Suite 13: Browser Compatibility (3 tests)

Total Tests: 47
Passed: __
Failed: __
Blocked: __
```

**Tester Name**: _______________
**Test Date**: _______________
**Build/Commit**: _______________
