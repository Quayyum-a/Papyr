/**
 * Stroke Grouping Algorithm
 * 
 * Intelligently determines whether two strokes should be grouped together
 * as part of the same handwriting segment based on temporal and spatial proximity.
 * 
 * This is the core logic that enables Papyr to understand natural handwriting
 * where multiple strokes belong to the same word/phrase.
 */

import type { Stroke } from '@/lib/ink-engine/types';
import type { StrokeGroupingConfig } from './types';
import { calculateBoundsDistance } from './types';

/**
 * Result of stroke grouping decision
 */
export interface StrokeGroupingResult {
  /** Whether the strokes should be grouped together */
  shouldGroup: boolean;
  
  /** Reason for the decision */
  reason:
    | 'temporal_proximity'        // Strokes are close in time
    | 'spatial_proximity'         // Strokes are close in space
    | 'time_gap_too_large'        // Too much time between strokes
    | 'spatial_distance_too_large'; // Strokes are too far apart
  
  /** Time gap between strokes (milliseconds) */
  timeGap: number;
  
  /** Spatial distance between stroke bounds (pixels) */
  spatialDistance: number;
}

/**
 * Determines whether two strokes should be grouped together as part
 * of the same handwriting segment.
 * 
 * Grouping Logic:
 * 1. Calculate time gap between strokes (stroke2.createdAt - stroke1.createdAt)
 * 2. Calculate spatial distance between stroke bounding boxes
 * 3. Strokes are grouped if BOTH:
 *    - Time gap <= maxTimeGap
 *    - Spatial distance <= maxSpatialDistance
 * 
 * This ensures that:
 * - Fast continuous writing (like "John") groups into one segment
 * - Distinct words with pauses separate into different segments
 * - Spatially distant marks (even if quick) don't group incorrectly
 * 
 * @param stroke1 - First stroke (earlier in time)
 * @param stroke2 - Second stroke (later in time)
 * @param config - Grouping configuration with thresholds
 * @returns Grouping decision with reason and measurements
 */
export function shouldGroupStrokes(
  stroke1: Stroke,
  stroke2: Stroke,
  config: StrokeGroupingConfig
): StrokeGroupingResult {
  // Calculate time gap
  const timeGap = Math.abs(stroke2.createdAt - stroke1.createdAt);
  
  // Calculate spatial distance between bounds
  const spatialDistance = calculateBoundsDistance(stroke1.bounds, stroke2.bounds);
  
  // Check temporal proximity first (most common rejection)
  if (timeGap > config.maxTimeGap) {
    return {
      shouldGroup: false,
      reason: 'time_gap_too_large',
      timeGap,
      spatialDistance,
    };
  }
  
  // Check spatial proximity
  if (spatialDistance > config.maxSpatialDistance) {
    return {
      shouldGroup: false,
      reason: 'spatial_distance_too_large',
      timeGap,
      spatialDistance,
    };
  }
  
  // Both conditions met - group these strokes
  // Determine primary reason (whichever is more constraining)
  const reason =
    timeGap / config.maxTimeGap > spatialDistance / config.maxSpatialDistance
      ? 'temporal_proximity'
      : 'spatial_proximity';
  
  return {
    shouldGroup: true,
    reason,
    timeGap,
    spatialDistance,
  };
}

/**
 * Groups an array of strokes into segments based on temporal and spatial proximity.
 * 
 * Algorithm:
 * 1. Start with first stroke as beginning of first segment
 * 2. For each subsequent stroke:
 *    a. Check if it should group with the last stroke in current segment
 *    b. If yes, add to current segment
 *    c. If no, finalize current segment and start new segment
 * 3. Return array of stroke groups
 * 
 * @param strokes - Array of strokes in chronological order
 * @param config - Grouping configuration
 * @returns Array of stroke arrays, where each inner array is a segment
 */
export function groupStrokesIntoSegments(
  strokes: Stroke[],
  config: StrokeGroupingConfig
): Stroke[][] {
  if (strokes.length === 0) {
    return [];
  }
  
  if (strokes.length === 1) {
    return [strokes];
  }
  
  const segments: Stroke[][] = [];
  let currentSegment: Stroke[] = [strokes[0]];
  
  for (let i = 1; i < strokes.length; i++) {
    const previousStroke = currentSegment[currentSegment.length - 1];
    const currentStroke = strokes[i];
    
    const groupingResult = shouldGroupStrokes(previousStroke, currentStroke, config);
    
    if (groupingResult.shouldGroup) {
      // Add to current segment
      currentSegment.push(currentStroke);
    } else {
      // Finalize current segment and start new one
      segments.push(currentSegment);
      currentSegment = [currentStroke];
    }
  }
  
  // Don't forget the last segment
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }
  
  return segments;
}

/**
 * Checks if a new stroke should be added to an existing segment
 * by comparing it against the most recent stroke in the segment.
 * 
 * @param segment - Existing strokes in the segment
 * @param newStroke - New stroke to potentially add
 * @param config - Grouping configuration
 * @returns Whether the new stroke belongs to this segment
 */
export function shouldAddToSegment(
  segment: Stroke[],
  newStroke: Stroke,
  config: StrokeGroupingConfig
): boolean {
  if (segment.length === 0) {
    return true; // Empty segment, always add
  }
  
  // Compare against the most recent stroke in the segment
  const lastStroke = segment[segment.length - 1];
  const result = shouldGroupStrokes(lastStroke, newStroke, config);
  
  return result.shouldGroup;
}
