import { describe, it, expect } from 'vitest';
import { shouldGroupStrokes } from './stroke-grouper';
import type { Stroke } from '@/lib/ink-engine/types';
import { DEFAULT_GROUPING_CONFIG } from './types';

describe('shouldGroupStrokes', () => {
  // Helper to create mock stroke with specific time and bounds
  const createMockStroke = (
    time: number,
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
  ): Stroke => ({
    id: `stroke-${time}`,
    tool: 'pen',
    color: '#000000',
    size: 'medium',
    segments: [],
    createdAt: time,
    bounds,
    cell_id: 'col-0-row-0',
  });

  describe('Temporal Grouping', () => {
    it('should group strokes that are temporally close (< 1s apart)', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1500, { minX: 12, minY: 0, maxX: 22, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
      expect(result.reason).toBe('temporal_proximity');
    });

    it('should NOT group strokes that are temporally far (> 1s apart)', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(3000, { minX: 12, minY: 0, maxX: 22, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(false);
      expect(result.reason).toBe('time_gap_too_large');
    });

    it('should handle exactly at the time threshold', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(2000, { minX: 12, minY: 0, maxX: 22, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      // At exactly maxTimeGap (1000ms), should group
      expect(result.shouldGroup).toBe(true);
    });
  });

  describe('Spatial Grouping', () => {
    it('should group strokes that are spatially close (< 40px apart)', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1100, { minX: 20, minY: 0, maxX: 30, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
      expect(result.reason).toBe('spatial_proximity');
    });

    it('should NOT group strokes that are spatially far (> 40px apart)', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1100, { minX: 100, minY: 0, maxX: 110, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(false);
      expect(result.reason).toBe('spatial_distance_too_large');
    });

    it('should group overlapping strokes (distance = 0)', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 20, maxY: 20 });
      const stroke2 = createMockStroke(1100, { minX: 10, minY: 10, maxX: 30, maxY: 30 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
      // Reason can be either temporal or spatial when both are true
    });

    it('should group touching strokes (boxes share edge)', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1100, { minX: 10, minY: 0, maxX: 20, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
      // Reason can be either temporal or spatial when both are true
    });
  });

  describe('Combined Temporal + Spatial Logic', () => {
    it('should require BOTH temporal AND spatial proximity to group', () => {
      // Close in time, far in space
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1100, { minX: 200, minY: 0, maxX: 210, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(false);
      expect(result.reason).toBe('spatial_distance_too_large');
    });

    it('should NOT group if spatially close but temporally far', () => {
      // Close in space, far in time
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(5000, { minX: 15, minY: 0, maxX: 25, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(false);
      expect(result.reason).toBe('time_gap_too_large');
    });

    it('should group when both time and space are within thresholds', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1500, { minX: 20, minY: 0, maxX: 30, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
    });
  });

  describe('Vertical Writing (Column Layout)', () => {
    it('should group vertically aligned strokes (top-to-bottom)', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1200, { minX: 0, minY: 20, maxX: 10, maxY: 30 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
      expect(result.reason).toBe('spatial_proximity');
    });

    it('should NOT group if vertically distant', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1200, { minX: 0, minY: 100, maxX: 10, maxY: 110 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(false);
      expect(result.reason).toBe('spatial_distance_too_large');
    });
  });

  describe('Real-World Handwriting Scenarios', () => {
    it('should group fast cursive writing (letters touching)', () => {
      // Simulating "John" in cursive with connected letters
      const j = createMockStroke(1000, { minX: 0, minY: 0, maxX: 8, maxY: 20 });
      const o = createMockStroke(1080, { minX: 6, minY: 8, maxX: 16, maxY: 18 });
      const h = createMockStroke(1160, { minX: 14, minY: 0, maxX: 22, maxY: 20 });
      const n = createMockStroke(1240, { minX: 20, minY: 8, maxX: 30, maxY: 18 });
      
      expect(shouldGroupStrokes(j, o, DEFAULT_GROUPING_CONFIG).shouldGroup).toBe(true);
      expect(shouldGroupStrokes(o, h, DEFAULT_GROUPING_CONFIG).shouldGroup).toBe(true);
      expect(shouldGroupStrokes(h, n, DEFAULT_GROUPING_CONFIG).shouldGroup).toBe(true);
    });

    it('should group print handwriting with small gaps', () => {
      // Simulating "John" in print with 5px gaps between letters
      const j = createMockStroke(1000, { minX: 0, minY: 0, maxX: 8, maxY: 20 });
      const o = createMockStroke(1150, { minX: 13, minY: 8, maxX: 23, maxY: 18 });
      const h = createMockStroke(1300, { minX: 28, minY: 0, maxX: 36, maxY: 20 });
      const n = createMockStroke(1450, { minX: 41, minY: 8, maxX: 51, maxY: 18 });
      
      expect(shouldGroupStrokes(j, o, DEFAULT_GROUPING_CONFIG).shouldGroup).toBe(true);
      expect(shouldGroupStrokes(o, h, DEFAULT_GROUPING_CONFIG).shouldGroup).toBe(true);
      expect(shouldGroupStrokes(h, n, DEFAULT_GROUPING_CONFIG).shouldGroup).toBe(true);
    });

    it('should separate two distinct words with longer pause', () => {
      // "John" (fast) then pause, then "Smith" (fast)
      const john_last = createMockStroke(1500, { minX: 20, minY: 0, maxX: 30, maxY: 20 });
      const smith_first = createMockStroke(3000, { minX: 40, minY: 0, maxX: 48, maxY: 20 });
      
      const result = shouldGroupStrokes(john_last, smith_first, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(false);
      expect(result.reason).toBe('time_gap_too_large');
    });

    it('should separate words written in different cell regions', () => {
      // One word at top of cell, another at bottom (suggests different entries)
      const top_word = createMockStroke(1000, { minX: 0, minY: 5, maxX: 30, maxY: 15 });
      const bottom_word = createMockStroke(1500, { minX: 0, minY: 80, maxX: 30, maxY: 90 });
      
      const result = shouldGroupStrokes(top_word, bottom_word, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(false);
      expect(result.reason).toBe('spatial_distance_too_large');
    });
  });

  describe('Multi-Stroke Characters', () => {
    it('should group strokes forming a single character (e.g., "t")', () => {
      // Vertical stem
      const stem = createMockStroke(1000, { minX: 5, minY: 0, maxX: 7, maxY: 20 });
      // Horizontal cross
      const cross = createMockStroke(1100, { minX: 2, minY: 8, maxX: 10, maxY: 10 });
      
      const result = shouldGroupStrokes(stem, cross, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
      // Reason can be either temporal or spatial when both are true
    });

    it('should group strokes forming a single character (e.g., "i")', () => {
      // Vertical line
      const line = createMockStroke(1000, { minX: 5, minY: 5, maxX: 7, maxY: 20 });
      // Dot
      const dot = createMockStroke(1080, { minX: 5, minY: 0, maxX: 7, maxY: 2 });
      
      const result = shouldGroupStrokes(line, dot, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
    });
  });

  describe('Custom Configuration', () => {
    it('should respect custom maxTimeGap', () => {
      const customConfig = { ...DEFAULT_GROUPING_CONFIG, maxTimeGap: 500 };
      
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1600, { minX: 12, minY: 0, maxX: 22, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, customConfig);
      
      expect(result.shouldGroup).toBe(false);
      expect(result.reason).toBe('time_gap_too_large');
    });

    it('should respect custom maxSpatialDistance', () => {
      const customConfig = { ...DEFAULT_GROUPING_CONFIG, maxSpatialDistance: 10 };
      
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1100, { minX: 25, minY: 0, maxX: 35, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, customConfig);
      
      expect(result.shouldGroup).toBe(false);
      expect(result.reason).toBe('spatial_distance_too_large');
    });
  });

  describe('Edge Cases', () => {
    it('should handle stroke with same timestamp', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 10, maxY: 10 });
      const stroke2 = createMockStroke(1000, { minX: 12, minY: 0, maxX: 22, maxY: 10 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
    });

    it('should handle very small strokes (dots)', () => {
      const stroke1 = createMockStroke(1000, { minX: 5, minY: 5, maxX: 6, maxY: 6 });
      const stroke2 = createMockStroke(1100, { minX: 10, minY: 5, maxX: 11, maxY: 6 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
    });

    it('should handle very large strokes', () => {
      const stroke1 = createMockStroke(1000, { minX: 0, minY: 0, maxX: 100, maxY: 100 });
      const stroke2 = createMockStroke(1100, { minX: 105, minY: 0, maxX: 150, maxY: 100 });
      
      const result = shouldGroupStrokes(stroke1, stroke2, DEFAULT_GROUPING_CONFIG);
      
      expect(result.shouldGroup).toBe(true);
    });
  });
});
