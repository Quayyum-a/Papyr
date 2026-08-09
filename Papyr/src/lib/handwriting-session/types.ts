/**
 * Handwriting Session Types
 * 
 * Defines the data structures for managing natural handwriting sessions
 * where multiple rapid/connected strokes are understood as meaningful
 * handwritten segments (words, phrases) rather than isolated strokes.
 */

import type { Stroke } from '@/lib/ink-engine/types';
import type { CellCoordinates } from '@/types/ledger';

/**
 * Represents a group of strokes that belong together as a single
 * handwritten word, phrase, or coherent writing segment.
 */
export interface HandwritingSegment {
  /** Unique identifier for this segment */
  id: string;
  
  /** Strokes that make up this segment */
  strokes: Stroke[];
  
  /** When the first stroke in this segment started */
  startTime: number;
  
  /** When the last stroke in this segment ended */
  endTime: number;
  
  /** Combined bounding box of all strokes in the segment */
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  
  /** Recognition result (if available) */
  recognizedText?: string | null;
  
  /** Whether recognition has been attempted for this segment */
  recognitionAttempted: boolean;
}

/**
 * Session status throughout the handwriting lifecycle
 */
export type HandwritingSessionStatus = 
  | 'idle'           // No active writing
  | 'active'         // User is currently writing
  | 'paused'         // User paused (between strokes, but may continue)
  | 'finalizing'     // Session ending, preparing for recognition
  | 'completed';     // Session complete, ready for next session

/**
 * Active handwriting session for a specific cell
 * 
 * A session tracks all strokes within a cell and intelligently groups
 * them into meaningful handwriting segments based on temporal and
 * spatial proximity.
 */
export interface HandwritingSession {
  /** Unique session identifier */
  id: string;
  
  /** Which cell this session is for */
  cellId: string;
  
  /** Cell coordinates (for spatial calculations) */
  cellCoords: CellCoordinates;
  
  /** Page identifier */
  pageId: string;
  
  /** Current session status */
  status: HandwritingSessionStatus;
  
  /** When this session started */
  startTime: number;
  
  /** When the last stroke was added */
  lastStrokeTime: number | null;
  
  /** All strokes captured in this session */
  strokes: Stroke[];
  
  /** Detected handwriting segments within this session */
  segments: HandwritingSegment[];
  
  /** Combined bounding box of all strokes */
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null;
}

/**
 * Configuration for stroke grouping behavior
 */
export interface StrokeGroupingConfig {
  /**
   * Maximum time gap (ms) between strokes to consider them part of same segment.
   * Default: 1000ms (1 second)
   * 
   * If strokes are closer than this, they're likely part of the same word.
   * If farther apart, the user has probably moved to a new word/phrase.
   */
  maxTimeGap: number;
  
  /**
   * Maximum spatial distance (pixels) between stroke bounds to group them.
   * Default: 40 pixels
   * 
   * Strokes within this distance are likely part of the same word,
   * especially for connected/cursive handwriting.
   */
  maxSpatialDistance: number;
  
  /**
   * Time to wait after last stroke before finalizing a segment.
   * Default: 1500ms (1.5 seconds)
   * 
   * After this pause, the segment is considered complete and ready
   * for recognition.
   */
  segmentFinalizationDelay: number;
  
  /**
   * Time to wait after last stroke before finalizing entire session.
   * Default: 3000ms (3 seconds)
   * 
   * After this pause with no new strokes, the entire session ends.
   */
  sessionFinalizationDelay: number;
}

/**
 * Default configuration for stroke grouping
 */
export const DEFAULT_GROUPING_CONFIG: StrokeGroupingConfig = {
  maxTimeGap: 1000,              // 1 second between strokes
  maxSpatialDistance: 40,        // 40 pixels between stroke bounds
  segmentFinalizationDelay: 1500, // 1.5 seconds to finalize segment
  sessionFinalizationDelay: 3000, // 3 seconds to finalize session
};

/**
 * Event emitted when a handwriting segment is detected/finalized
 */
export interface HandwritingSegmentEvent {
  sessionId: string;
  segment: HandwritingSegment;
  cellId: string;
  timestamp: number;
}

/**
 * Event emitted when an entire session completes
 */
export interface HandwritingSessionCompleteEvent {
  sessionId: string;
  session: HandwritingSession;
  timestamp: number;
}

/**
 * Helper to calculate Euclidean distance between two points
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Helper to calculate minimum distance between two bounding boxes
 */
export function calculateBoundsDistance(
  bounds1: { minX: number; minY: number; maxX: number; maxY: number },
  bounds2: { minX: number; minY: number; maxX: number; maxY: number }
): number {
  // If boxes overlap, distance is 0
  if (
    bounds1.maxX >= bounds2.minX &&
    bounds2.maxX >= bounds1.minX &&
    bounds1.maxY >= bounds2.minY &&
    bounds2.maxY >= bounds1.minY
  ) {
    return 0;
  }
  
  // Calculate horizontal distance
  let dx = 0;
  if (bounds1.maxX < bounds2.minX) {
    dx = bounds2.minX - bounds1.maxX;
  } else if (bounds2.maxX < bounds1.minX) {
    dx = bounds1.minX - bounds2.maxX;
  }
  
  // Calculate vertical distance
  let dy = 0;
  if (bounds1.maxY < bounds2.minY) {
    dy = bounds2.minY - bounds1.maxY;
  } else if (bounds2.maxY < bounds1.minY) {
    dy = bounds1.minY - bounds2.maxY;
  }
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Helper to merge two bounding boxes
 */
export function mergeBounds(
  bounds1: { minX: number; minY: number; maxX: number; maxY: number },
  bounds2: { minX: number; minY: number; maxX: number; maxY: number }
): { minX: number; minY: number; maxX: number; maxY: number } {
  return {
    minX: Math.min(bounds1.minX, bounds2.minX),
    minY: Math.min(bounds1.minY, bounds2.minY),
    maxX: Math.max(bounds1.maxX, bounds2.maxX),
    maxY: Math.max(bounds1.maxY, bounds2.maxY),
  };
}

/**
 * Generate a unique segment ID
 */
export function generateSegmentId(): string {
  return `segment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
