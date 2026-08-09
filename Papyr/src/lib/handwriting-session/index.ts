/**
 * Handwriting Session Module
 * 
 * Natural handwriting input engine that understands multiple strokes
 * as coherent handwriting segments (words, phrases) rather than
 * isolated individual strokes.
 * 
 * @module handwriting-session
 */

export { HandwritingSessionManager } from './HandwritingSessionManager';
export type { SegmentFinalizedListener, SessionCompleteListener } from './HandwritingSessionManager';

export {
  shouldGroupStrokes,
  groupStrokesIntoSegments,
  shouldAddToSegment,
} from './stroke-grouper';
export type { StrokeGroupingResult } from './stroke-grouper';

export {
  calculateDistance,
  calculateBoundsDistance,
  mergeBounds,
  generateSegmentId,
  generateSessionId,
  DEFAULT_GROUPING_CONFIG,
} from './types';

export type {
  HandwritingSession,
  HandwritingSegment,
  HandwritingSessionStatus,
  HandwritingSegmentEvent,
  HandwritingSessionCompleteEvent,
  StrokeGroupingConfig,
} from './types';
