import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HandwritingSessionManager } from './HandwritingSessionManager';
import type { Stroke } from '@/lib/ink-engine/types';
import type { CellCoordinates } from '@/types/ledger';

describe('HandwritingSessionManager', () => {
  let manager: HandwritingSessionManager;
  
  const mockCellCoords: CellCoordinates = { columnIndex: 0, rowIndex: 0 };
  const cellId = 'col-0-row-0';
  const pageId = 'page-123';
  
  beforeEach(() => {
    manager = new HandwritingSessionManager();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });
  
  const createMockStroke = (
    time: number,
    cell_id: string,
    bounds?: { minX: number; minY: number; maxX: number; maxY: number }
  ): Stroke => ({
    id: `stroke-${time}`,
    tool: 'pen',
    color: '#000000',
    size: 'medium',
    segments: [],
    createdAt: time,
    bounds: bounds || { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    cell_id,
  });
  
  describe('Session Lifecycle', () => {
    it('should start a new session when startSession is called', () => {
      manager.startSession(cellId, mockCellCoords, pageId);
      
      const session = manager.getActiveSession();
      expect(session).not.toBeNull();
      expect(session?.cellId).toBe(cellId);
      expect(session?.status).toBe('active');
      expect(session?.strokes).toHaveLength(0);
    });
    
    it('should not create duplicate sessions for same cell', () => {
      manager.startSession(cellId, mockCellCoords, pageId);
      const firstSessionId = manager.getActiveSession()?.id;
      
      manager.startSession(cellId, mockCellCoords, pageId);
      const secondSessionId = manager.getActiveSession()?.id;
      
      expect(firstSessionId).toBe(secondSessionId);
    });
    
    it('should finalize previous session when cell changes', () => {
      const completeListener = vi.fn();
      manager.onSessionComplete(completeListener);
      
      manager.startSession('col-0-row-0', mockCellCoords, pageId);
      manager.addStroke(createMockStroke(1000, 'col-0-row-0'));
      
      // Change to different cell
      manager.startSession('col-1-row-0', { columnIndex: 1, rowIndex: 0 }, pageId);
      
      expect(completeListener).toHaveBeenCalledTimes(1);
      expect(manager.getActiveSession()?.cellId).toBe('col-1-row-0');
    });
    
    it('should track session status changes', () => {
      manager.startSession(cellId, mockCellCoords, pageId);
      expect(manager.getActiveSession()?.status).toBe('active');
      
      manager.addStroke(createMockStroke(1000, cellId));
      expect(manager.getActiveSession()?.status).toBe('active');
      
      // After segment finalization delay
      vi.advanceTimersByTime(1500);
      expect(manager.getActiveSession()?.status).toBe('paused');
    });
  });
  
  describe('Stroke Collection', () => {
    beforeEach(() => {
      manager.startSession(cellId, mockCellCoords, pageId);
    });
    
    it('should add strokes to active session', () => {
      const stroke1 = createMockStroke(1000, cellId);
      const stroke2 = createMockStroke(1100, cellId);
      
      manager.addStroke(stroke1);
      manager.addStroke(stroke2);
      
      const session = manager.getActiveSession();
      expect(session?.strokes).toHaveLength(2);
      expect(session?.strokes[0]).toBe(stroke1);
      expect(session?.strokes[1]).toBe(stroke2);
    });
    
    it('should update lastStrokeTime when adding strokes', () => {
      manager.addStroke(createMockStroke(1000, cellId));
      expect(manager.getActiveSession()?.lastStrokeTime).toBe(1000);
      
      manager.addStroke(createMockStroke(2000, cellId));
      expect(manager.getActiveSession()?.lastStrokeTime).toBe(2000);
    });
    
    it('should update session bounds as strokes are added', () => {
      manager.addStroke(createMockStroke(1000, cellId, { minX: 0, minY: 0, maxX: 10, maxY: 10 }));
      manager.addStroke(createMockStroke(1100, cellId, { minX: 20, minY: 20, maxX: 30, maxY: 30 }));
      
      const bounds = manager.getActiveSession()?.bounds;
      expect(bounds).toEqual({ minX: 0, minY: 0, maxX: 30, maxY: 30 });
    });
    
    it('should ignore strokes with mismatched cell_id', () => {
      manager.addStroke(createMockStroke(1000, cellId));
      manager.addStroke(createMockStroke(1100, 'wrong-cell-id'));
      
      expect(manager.getActiveSession()?.strokes).toHaveLength(1);
    });
  });
  
  describe('Segment Creation and Grouping', () => {
    beforeEach(() => {
      manager.startSession(cellId, mockCellCoords, pageId);
    });
    
    it('should create first segment when first stroke is added', () => {
      manager.addStroke(createMockStroke(1000, cellId));
      
      expect(manager.getSegments()).toHaveLength(1);
      expect(manager.getSegments()[0].strokes).toHaveLength(1);
    });
    
    it('should group temporally close strokes into same segment', () => {
      manager.addStroke(createMockStroke(1000, cellId, { minX: 0, minY: 0, maxX: 10, maxY: 10 }));
      manager.addStroke(createMockStroke(1100, cellId, { minX: 12, minY: 0, maxX: 22, maxY: 10 }));
      manager.addStroke(createMockStroke(1200, cellId, { minX: 24, minY: 0, maxX: 34, maxY: 10 }));
      
      const segments = manager.getSegments();
      expect(segments).toHaveLength(1);
      expect(segments[0].strokes).toHaveLength(3);
    });
    
    it('should create new segment when strokes are temporally distant', () => {
      manager.addStroke(createMockStroke(1000, cellId));
      manager.addStroke(createMockStroke(3000, cellId)); // > 1s gap
      
      const segments = manager.getSegments();
      expect(segments).toHaveLength(2);
      expect(segments[0].strokes).toHaveLength(1);
      expect(segments[1].strokes).toHaveLength(1);
    });
    
    it('should create new segment when strokes are spatially distant', () => {
      manager.addStroke(createMockStroke(1000, cellId, { minX: 0, minY: 0, maxX: 10, maxY: 10 }));
      manager.addStroke(createMockStroke(1100, cellId, { minX: 100, minY: 0, maxX: 110, maxY: 10 }));
      
      const segments = manager.getSegments();
      expect(segments).toHaveLength(2);
    });
    
    it('should handle fast cursive writing (multiple strokes, one segment)', () => {
      // Simulate "John" in cursive
      manager.addStroke(createMockStroke(1000, cellId, { minX: 0, minY: 0, maxX: 8, maxY: 20 }));
      manager.addStroke(createMockStroke(1080, cellId, { minX: 6, minY: 8, maxX: 16, maxY: 18 }));
      manager.addStroke(createMockStroke(1160, cellId, { minX: 14, minY: 0, maxX: 22, maxY: 20 }));
      manager.addStroke(createMockStroke(1240, cellId, { minX: 20, minY: 8, maxX: 30, maxY: 18 }));
      
      const segments = manager.getSegments();
      expect(segments).toHaveLength(1);
      expect(segments[0].strokes).toHaveLength(4);
    });
  });
  
  describe('Segment Finalization', () => {
    beforeEach(() => {
      manager.startSession(cellId, mockCellCoords, pageId);
    });
    
    it('should finalize segment after segmentFinalizationDelay (1.5s)', () => {
      const listener = vi.fn();
      manager.onSegmentFinalized(listener);
      
      manager.addStroke(createMockStroke(1000, cellId));
      
      expect(listener).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(1500);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].segment.strokes).toHaveLength(1);
    });
    
    it('should not finalize same segment twice', () => {
      const listener = vi.fn();
      manager.onSegmentFinalized(listener);
      
      manager.addStroke(createMockStroke(1000, cellId));
      vi.advanceTimersByTime(1500);
      
      expect(listener).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(1500);
      
      // Still only called once
      expect(listener).toHaveBeenCalledTimes(1);
    });
    
    it('should reset timer when new stroke is added', () => {
      const listener = vi.fn();
      manager.onSegmentFinalized(listener);
      
      manager.addStroke(createMockStroke(1000, cellId));
      vi.advanceTimersByTime(1000);
      
      manager.addStroke(createMockStroke(2000, cellId));
      vi.advanceTimersByTime(1000);
      
      // Should not have finalized yet
      expect(listener).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(500);
      
      // Now it should finalize
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Session Finalization', () => {
    beforeEach(() => {
      manager.startSession(cellId, mockCellCoords, pageId);
    });
    
    it('should finalize session after sessionFinalizationDelay (3s)', () => {
      const listener = vi.fn();
      manager.onSessionComplete(listener);
      
      manager.addStroke(createMockStroke(1000, cellId));
      
      expect(listener).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(3000);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(manager.getActiveSession()).toBeNull();
    });
    
    it('should finalize session when endSession is called', () => {
      const listener = vi.fn();
      manager.onSessionComplete(listener);
      
      manager.addStroke(createMockStroke(1000, cellId));
      manager.endSession();
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(manager.getActiveSession()).toBeNull();
    });
    
    it('should include all segments in session complete event', () => {
      const listener = vi.fn();
      manager.onSessionComplete(listener);
      
      manager.addStroke(createMockStroke(1000, cellId));
      manager.addStroke(createMockStroke(3000, cellId)); // Creates second segment
      
      vi.advanceTimersByTime(3000);
      
      const session = listener.mock.calls[0][0].session;
      expect(session.segments).toHaveLength(2);
      expect(session.strokes).toHaveLength(2);
    });
  });
  
  describe('Event Listener Management', () => {
    it('should allow multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      manager.onSegmentFinalized(listener1);
      manager.onSegmentFinalized(listener2);
      
      manager.startSession(cellId, mockCellCoords, pageId);
      manager.addStroke(createMockStroke(1000, cellId));
      vi.advanceTimersByTime(1500);
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
    
    it('should support unsubscribing listeners', () => {
      const listener = vi.fn();
      const unsubscribe = manager.onSegmentFinalized(listener);
      
      manager.startSession(cellId, mockCellCoords, pageId);
      manager.addStroke(createMockStroke(1000, cellId));
      
      unsubscribe();
      
      vi.advanceTimersByTime(1500);
      
      expect(listener).not.toHaveBeenCalled();
    });
    
    it('should not crash if listener throws error', () => {
      const errorListener = vi.fn(() => { throw new Error('Test error'); });
      const goodListener = vi.fn();
      
      manager.onSegmentFinalized(errorListener);
      manager.onSegmentFinalized(goodListener);
      
      manager.startSession(cellId, mockCellCoords, pageId);
      manager.addStroke(createMockStroke(1000, cellId));
      
      expect(() => {
        vi.advanceTimersByTime(1500);
      }).not.toThrow();
      
      expect(goodListener).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Recognition State Management', () => {
    beforeEach(() => {
      manager.startSession(cellId, mockCellCoords, pageId);
    });
    
    it('should track unrecognized segments', () => {
      manager.addStroke(createMockStroke(1000, cellId));
      manager.addStroke(createMockStroke(3000, cellId));
      
      const unrecognized = manager.getUnrecognizedSegments();
      expect(unrecognized).toHaveLength(2);
    });
    
    it('should mark segment as recognized', () => {
      manager.addStroke(createMockStroke(1000, cellId));
      
      const segmentId = manager.getSegments()[0].id;
      manager.markSegmentRecognized(segmentId, 'John');
      
      const segment = manager.getSegments()[0];
      expect(segment.recognitionAttempted).toBe(true);
      expect(segment.recognizedText).toBe('John');
      
      expect(manager.getUnrecognizedSegments()).toHaveLength(0);
    });
  });
  
  describe('Configuration Management', () => {
    it('should use custom configuration', () => {
      const customManager = new HandwritingSessionManager({
        maxTimeGap: 500,
        maxSpatialDistance: 20,
      });
      
      const config = customManager.getConfig();
      expect(config.maxTimeGap).toBe(500);
      expect(config.maxSpatialDistance).toBe(20);
      
      customManager.destroy();
    });
    
    it('should allow runtime configuration updates', () => {
      manager.setConfig({ maxTimeGap: 2000 });
      
      const config = manager.getConfig();
      expect(config.maxTimeGap).toBe(2000);
    });
  });
  
  describe('Cleanup', () => {
    it('should cleanup timers on destroy', () => {
      manager.startSession(cellId, mockCellCoords, pageId);
      manager.addStroke(createMockStroke(1000, cellId));
      
      const listener = vi.fn();
      manager.onSegmentFinalized(listener);
      
      manager.destroy();
      
      vi.advanceTimersByTime(5000);
      
      // Listeners should not fire after destroy
      expect(listener).not.toHaveBeenCalled();
    });
    
    it('should finalize active session on destroy', () => {
      const listener = vi.fn();
      manager.onSessionComplete(listener);
      
      manager.startSession(cellId, mockCellCoords, pageId);
      manager.addStroke(createMockStroke(1000, cellId));
      
      manager.destroy();
      
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Utility Methods', () => {
    it('should check if session exists for cell', () => {
      expect(manager.hasActiveSessionForCell(cellId)).toBe(false);
      
      manager.startSession(cellId, mockCellCoords, pageId);
      expect(manager.hasActiveSessionForCell(cellId)).toBe(true);
      
      manager.endSession();
      expect(manager.hasActiveSessionForCell(cellId)).toBe(false);
    });
    
    it('should return empty arrays when no active session', () => {
      expect(manager.getSegments()).toEqual([]);
      expect(manager.getUnrecognizedSegments()).toEqual([]);
    });
  });
});
