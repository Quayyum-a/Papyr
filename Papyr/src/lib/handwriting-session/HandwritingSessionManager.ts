/**
 * Handwriting Session Manager
 * 
 * Core class that manages the lifecycle of handwriting sessions for natural
 * handwriting input. Handles stroke collection, intelligent segmentation,
 * and event emissions for recognition triggers.
 * 
 * Lifecycle:
 * 1. Session starts when user writes in a cell
 * 2. Strokes are collected and grouped into segments
 * 3. After pause, segments are finalized and ready for recognition
 * 4. Session completes after longer pause or cell change
 */

import type { Stroke } from '@/lib/ink-engine/types';
import type { CellCoordinates } from '@/types/ledger';
import type {
  HandwritingSession,
  HandwritingSegment,
  HandwritingSessionStatus,
  HandwritingSegmentEvent,
  HandwritingSessionCompleteEvent,
  StrokeGroupingConfig,
} from './types';
import {
  DEFAULT_GROUPING_CONFIG,
  generateSessionId,
  generateSegmentId,
  mergeBounds,
} from './types';
import { groupStrokesIntoSegments, shouldAddToSegment } from './stroke-grouper';

/**
 * Event listener types for session events
 */
export type SegmentFinalizedListener = (event: HandwritingSegmentEvent) => void;
export type SessionCompleteListener = (event: HandwritingSessionCompleteEvent) => void;

/**
 * HandwritingSessionManager
 * 
 * Manages active handwriting sessions and emits events when segments
 * are ready for recognition.
 */
export class HandwritingSessionManager {
  private activeSession: HandwritingSession | null = null;
  private config: StrokeGroupingConfig;
  
  // Timers for segment and session finalization
  private segmentFinalizationTimer: NodeJS.Timeout | null = null;
  private sessionFinalizationTimer: NodeJS.Timeout | null = null;
  
  // Event listeners
  private segmentFinalizedListeners: SegmentFinalizedListener[] = [];
  private sessionCompleteListeners: SessionCompleteListener[] = [];
  
  // Debug mode
  private debugMode: boolean = false;
  
  constructor(config?: Partial<StrokeGroupingConfig>) {
    this.config = { ...DEFAULT_GROUPING_CONFIG, ...config };
  }
  
  /**
   * Enable or disable debug logging
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  private log(message: string, ...args: any[]): void {
    if (this.debugMode) {
      console.log(`[INK SESSION] ${message}`, ...args);
    }
  }
  
  /**
   * Start a new handwriting session for a specific cell
   */
  startSession(cellId: string, cellCoords: CellCoordinates, pageId: string): void {
    // If there's an active session for a different cell, finalize it immediately
    if (this.activeSession && this.activeSession.cellId !== cellId) {
      this.log('CELL_CHANGED - Finalizing previous session');
      this.finalizeSession();
    }
    
    // If already have a session for this cell, just update status
    if (this.activeSession && this.activeSession.cellId === cellId) {
      this.activeSession.status = 'active';
      this.log('SESSION_RESUMED', { cellId });
      return;
    }
    
    // Create new session
    const session: HandwritingSession = {
      id: generateSessionId(),
      cellId,
      cellCoords,
      pageId,
      status: 'active',
      startTime: Date.now(),
      lastStrokeTime: null,
      strokes: [],
      segments: [],
      bounds: null,
    };
    
    this.activeSession = session;
    this.log('SESSION_STARTED', { sessionId: session.id, cellId });
  }
  
  /**
   * Add a stroke to the active session
   */
  addStroke(stroke: Stroke): void {
    if (!this.activeSession) {
      this.log('WARNING: No active session - stroke ignored');
      return;
    }
    
    // Ensure stroke belongs to this session's cell
    if (stroke.cell_id !== this.activeSession.cellId) {
      this.log('WARNING: Stroke cell_id mismatch', {
        expected: this.activeSession.cellId,
        received: stroke.cell_id,
      });
      return;
    }
    
    // Add stroke to session
    this.activeSession.strokes.push(stroke);
    this.activeSession.lastStrokeTime = stroke.createdAt;
    this.activeSession.status = 'active';
    
    // Update session bounds
    this.updateSessionBounds(stroke);
    
    // Try to add stroke to existing segment or create new segment
    this.processStroke(stroke);
    
    this.log('STROKE_ADDED', {
      strokeId: stroke.id,
      totalStrokes: this.activeSession.strokes.length,
      segments: this.activeSession.segments.length,
    });
    
    // Reset finalization timers since user is still writing
    this.resetFinalizationTimers();
    
    // Start new finalization timers
    this.startFinalizationTimers();
  }
  
  /**
   * Process a new stroke - either add to existing segment or create new segment
   */
  private processStroke(stroke: Stroke): void {
    if (!this.activeSession) return;
    
    const segments = this.activeSession.segments;
    
    // If no segments yet, create first segment
    if (segments.length === 0) {
      this.createNewSegment(stroke);
      return;
    }
    
    // Try to add to last segment
    const lastSegment = segments[segments.length - 1];
    
    if (shouldAddToSegment(lastSegment.strokes, stroke, this.config)) {
      // Add to existing segment
      lastSegment.strokes.push(stroke);
      lastSegment.endTime = stroke.createdAt;
      
      // Update segment bounds
      lastSegment.bounds = mergeBounds(lastSegment.bounds, stroke.bounds);
      
      this.log('STROKE_ADDED_TO_SEGMENT', {
        segmentId: lastSegment.id,
        strokeCount: lastSegment.strokes.length,
      });
    } else {
      // Create new segment
      this.createNewSegment(stroke);
      this.log('NEW_SEGMENT_CREATED', { reason: 'grouping_criteria_not_met' });
    }
  }
  
  /**
   * Create a new segment with the given stroke
   */
  private createNewSegment(stroke: Stroke): void {
    if (!this.activeSession) return;
    
    const segment: HandwritingSegment = {
      id: generateSegmentId(),
      strokes: [stroke],
      startTime: stroke.createdAt,
      endTime: stroke.createdAt,
      bounds: { ...stroke.bounds },
      recognitionAttempted: false,
    };
    
    this.activeSession.segments.push(segment);
  }
  
  /**
   * Update the session's overall bounding box
   */
  private updateSessionBounds(stroke: Stroke): void {
    if (!this.activeSession) return;
    
    if (!this.activeSession.bounds) {
      this.activeSession.bounds = { ...stroke.bounds };
    } else {
      this.activeSession.bounds = mergeBounds(this.activeSession.bounds, stroke.bounds);
    }
  }
  
  /**
   * Reset all finalization timers
   */
  private resetFinalizationTimers(): void {
    if (this.segmentFinalizationTimer) {
      clearTimeout(this.segmentFinalizationTimer);
      this.segmentFinalizationTimer = null;
    }
    
    if (this.sessionFinalizationTimer) {
      clearTimeout(this.sessionFinalizationTimer);
      this.sessionFinalizationTimer = null;
    }
  }
  
  /**
   * Start finalization timers after a stroke
   */
  private startFinalizationTimers(): void {
    if (!this.activeSession) return;
    
    // Segment finalization timer (shorter - for recognizing current segment)
    this.segmentFinalizationTimer = setTimeout(() => {
      this.finalizeCurrentSegment();
    }, this.config.segmentFinalizationDelay);
    
    // Session finalization timer (longer - for ending entire session)
    this.sessionFinalizationTimer = setTimeout(() => {
      this.finalizeSession();
    }, this.config.sessionFinalizationDelay);
  }
  
  /**
   * Finalize the current segment (last one) and emit event for recognition
   */
  private finalizeCurrentSegment(): void {
    if (!this.activeSession) return;
    
    const segments = this.activeSession.segments;
    if (segments.length === 0) return;
    
    const lastSegment = segments[segments.length - 1];
    
    // Only finalize if not already recognized
    if (!lastSegment.recognitionAttempted) {
      this.activeSession.status = 'paused';
      
      this.log('SEGMENT_FINALIZED', {
        segmentId: lastSegment.id,
        strokeCount: lastSegment.strokes.length,
      });
      
      // Emit event for recognition
      this.emitSegmentFinalized(lastSegment);
    }
  }
  
  /**
   * Finalize the entire session and emit completion event
   */
  finalizeSession(): void {
    if (!this.activeSession) return;
    
    this.log('SESSION_FINALIZING', {
      sessionId: this.activeSession.id,
      totalStrokes: this.activeSession.strokes.length,
      totalSegments: this.activeSession.segments.length,
    });
    
    this.resetFinalizationTimers();
    
    this.activeSession.status = 'completed';
    
    // Emit session complete event
    this.emitSessionComplete(this.activeSession);
    
    // Clear active session
    const completedSession = this.activeSession;
    this.activeSession = null;
    
    this.log('SESSION_COMPLETED', {
      sessionId: completedSession.id,
      duration: Date.now() - completedSession.startTime,
    });
  }
  
  /**
   * Force finalize current session (e.g., when cell selection changes)
   */
  endSession(): void {
    if (this.activeSession) {
      this.finalizeSession();
    }
  }
  
  /**
   * Get the current active session
   */
  getActiveSession(): HandwritingSession | null {
    return this.activeSession;
  }
  
  /**
   * Check if there's an active session for a specific cell
   */
  hasActiveSessionForCell(cellId: string): boolean {
    return this.activeSession?.cellId === cellId && this.activeSession.status !== 'completed';
  }
  
  /**
   * Get all segments from active session
   */
  getSegments(): HandwritingSegment[] {
    return this.activeSession?.segments || [];
  }
  
  /**
   * Get unrecognized segments (for batch recognition)
   */
  getUnrecognizedSegments(): HandwritingSegment[] {
    if (!this.activeSession) return [];
    return this.activeSession.segments.filter(seg => !seg.recognitionAttempted);
  }
  
  /**
   * Mark a segment as recognized (to avoid duplicate recognition attempts)
   */
  markSegmentRecognized(segmentId: string, recognizedText?: string): void {
    if (!this.activeSession) return;
    
    const segment = this.activeSession.segments.find(seg => seg.id === segmentId);
    if (segment) {
      segment.recognitionAttempted = true;
      if (recognizedText !== undefined) {
        segment.recognizedText = recognizedText;
      }
      
      this.log('SEGMENT_RECOGNIZED', { segmentId, recognizedText });
    }
  }
  
  /**
   * Event listener registration
   */
  onSegmentFinalized(listener: SegmentFinalizedListener): () => void {
    this.segmentFinalizedListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.segmentFinalizedListeners = this.segmentFinalizedListeners.filter(l => l !== listener);
    };
  }
  
  onSessionComplete(listener: SessionCompleteListener): () => void {
    this.sessionCompleteListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.sessionCompleteListeners = this.sessionCompleteListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Emit segment finalized event to all listeners
   */
  private emitSegmentFinalized(segment: HandwritingSegment): void {
    if (!this.activeSession) return;
    
    const event: HandwritingSegmentEvent = {
      sessionId: this.activeSession.id,
      segment,
      cellId: this.activeSession.cellId,
      timestamp: Date.now(),
    };
    
    this.segmentFinalizedListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[INK SESSION] Error in segment finalized listener:', error);
      }
    });
  }
  
  /**
   * Emit session complete event to all listeners
   */
  private emitSessionComplete(session: HandwritingSession): void {
    const event: HandwritingSessionCompleteEvent = {
      sessionId: session.id,
      session,
      timestamp: Date.now(),
    };
    
    this.sessionCompleteListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[INK SESSION] Error in session complete listener:', error);
      }
    });
  }
  
  /**
   * Update grouping configuration
   */
  setConfig(config: Partial<StrokeGroupingConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('CONFIG_UPDATED', this.config);
  }
  
  /**
   * Get current configuration
   */
  getConfig(): StrokeGroupingConfig {
    return { ...this.config };
  }
  
  /**
   * Clean up - call when component unmounts
   */
  destroy(): void {
    this.resetFinalizationTimers();
    
    if (this.activeSession) {
      this.finalizeSession();
    }
    
    this.segmentFinalizedListeners = [];
    this.sessionCompleteListeners = [];
    
    this.log('MANAGER_DESTROYED');
  }
}
