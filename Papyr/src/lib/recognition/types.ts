/**
 * Recognition Domain Types
 *
 * Core types for the automatic per-cell handwriting recognition system.
 * Designed for MyScript stroke-based recognition with revision safety.
 */

import type { Stroke } from '@/lib/ink-engine/types';
import type { CellCoordinates } from '@/types/ledger';

/**
 * Recognition job status lifecycle
 */
export type RecognitionStatus =
  | 'idle'           // No recognition pending or in progress
  | 'pending'        // Waiting for quiet period / queued
  | 'queued'         // In offline queue, waiting for connectivity
  | 'recognizing'    // Active recognition request to MyScript
  | 'recognized'     // Successfully recognized, text stored
  | 'failed';        // Recognition failed (transient or permanent)

/**
 * Recognition job representing a unit of work for a cell
 */
export interface RecognitionJob {
  /** Unique job identifier */
  id: string;

  /** Book this cell belongs to */
  bookId: string;

  /** Page this cell belongs to */
  pageId: string;

  /** Cell identifier (format: "col-{columnIndex}-row-{rowIndex}") */
  cellId: string;

  /** Cell coordinates for bounds calculation */
  cellCoords: CellCoordinates;

  /** Column type for recognition context (text, number, date) */
  columnType?: 'text' | 'number' | 'date';

  /** Column label for recognition hints */
  columnLabel?: string;

  /** Strokes to recognize */
  strokes: Stroke[];

  /** Cell revision at time of job creation */
  cellRevision: number;

  /** Current job status */
  status: RecognitionStatus;

  /** Number of recognition attempts */
  attemptCount: number;

  /** Maximum retry attempts */
  maxRetries: number;

  /** When this job was created */
  createdAt: number;

  /** When recognition started (if applicable) */
  startedAt?: number;

  /** When recognition completed (success or final failure) */
  completedAt?: number;

  /** Recognition result text (on success) */
  recognizedText?: string;

  /** Error message (on failure) */
  error?: string;

  /** MyScript-specific metadata */
  myscriptMetadata?: MyScriptRecognitionMetadata;
}

/**
 * MyScript-specific recognition metadata for extensibility
 */
export interface MyScriptRecognitionMetadata {
  /** MyScript job ID */
  jobId?: string;

  /** Recognition language used */
  language?: string;

  /** Raw MyScript JIIX response (for future features) */
  jiix?: unknown;

  /** Confidence score if available */
  confidence?: number;

  /** Alternative candidates if available */
  candidates?: string[];
}

/**
 * Cell recognition state stored in cell data
 * This extends the existing LedgerCellData concept
 */
export interface CellRecognitionState {
  /** Current recognition status for this cell */
  recognitionStatus: RecognitionStatus;

  /** Revision of the cell's strokes when recognition was last successful */
  recognitionRevision: number;

  /** Recognized text (empty string if recognition failed/empty) */
  recognizedText: string;

  /** When recognition was last completed successfully */
  recognizedAt?: number;

  /** Error message if last attempt failed */
  recognitionError?: string;

  /** Whether there are pending strokes not yet recognized */
  hasPendingStrokes: boolean;

  /** Pending job ID if recognition is in progress */
  pendingJobId?: string;
}

/**
 * Configuration for recognition behavior
 */
export interface RecognitionConfig {
  /** Quiet period after last stroke before triggering recognition (ms) */
  quietPeriodMs: number;

  /** Maximum concurrent recognition requests */
  maxConcurrentJobs: number;

  /** Maximum retry attempts for failed recognition */
  maxRetries: number;

  /** Base retry delay (ms) - exponential backoff applied */
  retryBaseDelayMs: number;

  /** Maximum retry delay cap (ms) */
  retryMaxDelayMs: number;

  /** MyScript recognition language */
  language: string;

  /** Whether to enable debug logging */
  debug: boolean;
}

/**
 * Default recognition configuration
 */
export const DEFAULT_RECOGNITION_CONFIG: RecognitionConfig = {
  quietPeriodMs: 1000,          // 1 second pause triggers recognition
  maxConcurrentJobs: 2,         // Limit concurrent network requests
  maxRetries: 3,                // Max 3 attempts per job
  retryBaseDelayMs: 1000,       // 1s, 2s, 4s...
  retryMaxDelayMs: 10000,       // Cap at 10 seconds
  language: 'en_US',            // MyScript language code
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Result of a recognition attempt
 */
export interface RecognitionResult {
  /** Whether recognition succeeded */
  success: boolean;

  /** Recognized text (if success) */
  text?: string;

  /** Error message (if failed) */
  error?: string;

  /** MyScript metadata */
  metadata?: MyScriptRecognitionMetadata;

  /** The revision this result corresponds to */
  cellRevision: number;
}

/**
 * Request payload for server-side recognition
 */
export interface RecognizeRequest {
  bookId: string;
  pageId: string;
  cellId: string;
  cellCoords: CellCoordinates;
  columnType?: 'text' | 'number' | 'date';
  columnLabel?: string;
  strokes: Stroke[];
  cellRevision: number;
  language: string;
}

/**
 * Response from server-side recognition
 */
export interface RecognizeResponse {
  success: boolean;
  recognizedText?: string;
  error?: string;
  cellRevision: number;
  metadata?: MyScriptRecognitionMetadata;
}

/**
 * Queue entry for offline recognition
 */
export interface OfflineRecognitionQueueEntry {
  id: string;
  job: RecognitionJob;
  queuedAt: number;
  retries: number;
}