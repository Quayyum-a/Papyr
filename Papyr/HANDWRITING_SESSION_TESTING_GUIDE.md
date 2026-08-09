# Handwriting Session Engine - Manual Testing Guide

## Overview
This guide walks through manual testing of the new Natural Handwriting Session Engine, which groups multiple rapid strokes into coherent segments (words) before triggering recognition.

## What Changed
- **OLD BEHAVIOR**: Each pointer-down-to-pointer-up triggered immediate recognition (writing "John" = 4-10+ separate recognition calls)
- **NEW BEHAVIOR**: Multiple connected strokes are grouped into segments before recognition (writing "John" quickly = 1 recognition call for the complete word)

## Architecture
1. **HandwritingSessionManager**: Manages session lifecycle and stroke grouping
2. **Stroke Grouper**: Groups strokes based on temporal (<1s gap) and spatial (<40px distance) proximity
3. **Integration**: Strokes feed both ink engine (rendering) AND session manager (grouping)
4. **Event-Driven**: Recognition triggers on segment finalization, not individual strokes

## Testing Checklist

### Test 1: Fast Cursive Writing (Primary Use Case)
**Goal**: Verify that quickly written words group into single segments

1. Open a book and select any cell
2. Write "John" quickly (as if writing naturally with a pen)
3. **Expected Console Output**:
   ```
   [INK SESSION] CELL_SELECTED: {...}
   [INK SESSION] SESSION_STARTED: {...}
   [INK SESSION] STROKE_ADDED: stroke 1/X
   [INK SESSION] STROKE_ADDED: stroke 2/X
   ...
   [INK SESSION] SEGMENT_FINALIZED: X strokes grouped
   [INK] RECOGNITION_START: Processing X strokes
   ```
4. Wait 1 second after finishing
5. **Expected**: Recognition triggers ONCE for all strokes
6. **Success Criteria**: "John" should NOT trigger 4+ separate recognition calls

### Test 2: Separate Words with Pause
**Goal**: Verify that pausing between words creates separate segments

1. Select a cell
2. Write "John" quickly
3. Wait 1.5 seconds (longer than grouping threshold)
4. Write "Smith" quickly
5. **Expected Console Output**:
   ```
   [INK SESSION] SEGMENT_FINALIZED: X strokes (John)
   [INK] RECOGNITION_START: Processing X strokes
   [INK SESSION] SEGMENT_FINALIZED: Y strokes (Smith)
   [INK] RECOGNITION_START: Processing Y strokes
   ```
6. **Success Criteria**: Two separate recognition calls (one for "John", one for "Smith")

### Test 3: Multi-Stroke Characters (Print Writing)
**Goal**: Verify that characters requiring multiple strokes (like "t", "i", "x") group properly

1. Select a cell
2. Write the letter "t" in print style:
   - Draw vertical stroke
   - Draw horizontal cross stroke (within 1 second)
3. **Expected**: Both strokes group into one segment
4. Write "test" in print style (each letter requires 1-2 strokes)
5. **Expected**: All strokes for "test" group together if written quickly

### Test 4: Spatial Proximity Grouping
**Goal**: Verify that spatially close strokes group even with small time gaps

1. Select a cell
2. Write two strokes very close together (< 40px apart) with ~0.5s pause
3. **Expected**: Strokes group together
4. Write two strokes far apart (> 40px) even quickly
5. **Expected**: Strokes may finalize separately depending on distance

### Test 5: Session Cleanup on Cell Switch
**Goal**: Verify session ends properly when switching cells

1. Select cell A and write "test"
2. Immediately select cell B (before recognition finishes)
3. **Expected Console Output**:
   ```
   [INK SESSION] SESSION_COMPLETED: {...}
   [INK SESSION] MANAGER_DESTROYED
   [INK SESSION] CELL_SELECTED: {...}
   [INK SESSION] SESSION_STARTED: {...}
   ```
4. Write in cell B
5. **Success Criteria**: No errors, clean session transition

### Test 6: Offline Behavior
**Goal**: Verify handwriting works without network

1. Open Developer Tools → Network tab
2. Set throttling to "Offline"
3. Select a cell and write "test"
4. **Expected**: 
   - Ink renders immediately (no lag)
   - Strokes are visible
   - Session grouping works
   - Recognition attempts but fails gracefully
5. Go back online
6. **Expected**: Previously drawn strokes persist

### Test 7: Recognition Success Flow
**Goal**: Verify end-to-end flow with successful recognition

1. Ensure you have internet connection
2. Select a cell and write a simple number: "123"
3. Wait 1 second
4. **Expected Console Output**:
   ```
   [INK SESSION] SEGMENT_FINALIZED: X strokes
   [INK] RECOGNITION_START: Processing X strokes
   [INK] RECOGNITION_SUCCESS: "123"
   ```
5. **Success Criteria**: Cell displays recognized text "123"

### Test 8: Rapid Multiple Segments
**Goal**: Stress test with multiple quick words

1. Select a cell
2. Write "one two three" quickly with small pauses between words
3. **Expected**: 
   - 3 separate segments (one for each word)
   - 3 recognition calls
   - Console shows clear segment boundaries

### Test 9: Edge Case - Single Dot/Tap
**Goal**: Verify single taps work properly

1. Select a cell
2. Tap once (very short stroke)
3. Wait 1 second
4. **Expected**: Single stroke finalizes and triggers recognition

### Test 10: Long Writing Session
**Goal**: Verify no memory leaks or performance issues

1. Select a cell
2. Write continuously for 30 seconds (multiple words, sentences)
3. **Expected**:
   - No console errors
   - No lag or slowdown
   - Multiple segment finalizations
   - Clean session management

## Debug Console Output Reference

### Key Log Prefixes
- `[INK SESSION]` - HandwritingSessionManager events
- `[INK]` - useLedgerWorkspace recognition flow

### Normal Flow
```
[INK SESSION] CELL_SELECTED
[INK SESSION] SESSION_STARTED
[INK SESSION] STROKE_ADDED (multiple times)
[INK SESSION] SEGMENT_FINALIZED
[INK] RECOGNITION_START
[INK] RECOGNITION_SUCCESS or RECOGNITION_FAILED
```

### Error Indicators
- Multiple rapid `RECOGNITION_START` logs = stroke grouping not working
- No `SEGMENT_FINALIZED` after writing = session manager not working
- Errors mentioning "sessionManager" = integration issue

## Success Criteria Summary

✅ **Pass Criteria**:
- Writing "John" quickly = 1 recognition call (not 4-10+)
- Console shows clear segment finalization events
- No TypeScript or runtime errors
- Strokes render immediately (ink engine not affected)
- Recognition triggers on segments, not individual strokes
- Session cleanup happens on cell switch
- Offline writing works (strokes persist locally)

❌ **Fail Criteria**:
- Each stroke triggers immediate recognition
- Console flooded with recognition calls
- Lag or delay in ink rendering
- Session manager errors
- Recognition fires before segment completes
- Memory leaks (use Chrome DevTools Performance tab)

## Troubleshooting

### Issue: Recognition triggers on every stroke
**Fix**: Check that `useLedgerWorkspace` is using `sessionManager.on('segment_finalized')` not `onPointerUp`

### Issue: Strokes don't group
**Fix**: Verify stroke-grouper thresholds (time: 1000ms, distance: 40px)

### Issue: Session doesn't start
**Fix**: Check that `sessionManager.startSession()` is called when cell is selected

### Issue: Console shows no [INK SESSION] logs
**Fix**: Ensure DEBUG constant is true in HandwritingSessionManager

## Next Steps After Manual Testing

1. Document any issues found
2. Adjust grouping thresholds if needed (time/distance)
3. Test on real device (phone/tablet) for touch behavior
4. Collect user feedback on grouping behavior
5. Consider adding UI indicators for segment boundaries (optional)
