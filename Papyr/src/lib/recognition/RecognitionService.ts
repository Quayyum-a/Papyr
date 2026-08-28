/**
 * Recognition Service - Client-side
 *
 * Manages automatic per-cell handwriting recognition:
 * - Quiet-period debounce scheduling
 * - Revision tracking for race condition prevention
 * - Deduplication of recognition jobs
 * - Concurrent job limiting
 * - Offline queue integration (localStorage-based)
 * - Retry with exponential backoff
 */

import type { Stroke } from '@/lib/ink-engine/types';
import type { CellCoordinates, LedgerConfig, LedgerColumnType } from '@/types/ledger';
import type {
  RecognitionJob,
  RecognitionStatus,
  RecognitionConfig,
  RecognitionResult,
  CellRecognitionState,
  OfflineRecognitionQueueEntry,
  DEFAULT_RECOGNITION_CONFIG,
} from './types';
import { DEFAULT_RECOGNITION_CONFIG as DefaultConfig } from './types';

const OFFLINE_QUEUE_KEY = 'papyr_recognition_offline_queue';

/**
 * Configuration for the recognition service
 */
interface RecognitionServiceConfig extends Partial<RecognitionConfig> {
  /** Book ID for this workspace */
  bookId: string;
  /** Page ID for this workspace */
  pageId: string;
  /** Ledger config for column info */
  ledgerConfig: LedgerConfig;
  /** Callback when cell recognition state changes */
  onCellStateChange?: (cellId: string, state: CellRecognitionState) => void;
  /** Callback when recognition completes (success or final failure) */
  onRecognitionComplete?: (cellId: string, result: RecognitionResult) => void;
  /** Check if online */
  isOnline?: () => boolean;
}

/**
 * Internal job state tracking
 */
interface JobState {
  job: RecognitionJob;
  timerId: NodeJS.Timeout | null;
  abortController: AbortController | null;
}

/**
 * RecognitionService class
 */
export class RecognitionService {
  private config: RecognitionConfig;
  private bookId: string;
  private pageId: string;
  private ledgerConfig: LedgerConfig;
  private onCellStateChange?: (cellId: string, state: CellRecognitionState) => void;
  private onRecognitionComplete?: (cellId: string, result: RecognitionResult) => void;
  private isOnline: () => boolean;

  // Per-cell state
  private cellRevisions: Map<string, number> = new Map();
  private cellStates: Map<string, CellRecognitionState> = new Map();
  private pendingTimers: Map<string, NodeJS.Timeout> = new Map();
  private activeJobs: Map<string, JobState> = new Map();
  private jobQueue: RecognitionJob[] = [];
  private runningJobCount = 0;

  // Offline queue
  private offlineQueue: OfflineRecognitionQueueEntry[] = [];
  private isProcessingOfflineQueue = false;

  // Debug
  private debug: boolean;

  constructor(config: RecognitionServiceConfig) {
    this.config = { ...DefaultConfig, ...config };
    this.bookId = config.bookId;
    this.pageId = config.pageId;
    this.ledgerConfig = config.ledgerConfig;
    this.onCellStateChange = config.onCellStateChange;
    this.onRecognitionComplete = config.onRecognitionComplete;
    this.isOnline = config.isOnline ?? (() => navigator.onLine);
    this.debug = this.config.debug;

    // Load offline queue from localStorage
    this.loadOfflineQueue();

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }

    this.log('RecognitionService initialized', { config: this.config });
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
        this.log('Loaded offline queue', { count: this.offlineQueue.length });
      }
    } catch (error) {
      console.error('[RecognitionService] Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('[RecognitionService] Failed to save offline queue:', error);
    }
  }

  /**
   * Add job to offline queue
   */
  private addToOfflineQueue(job: RecognitionJob): void {
    const entry: OfflineRecognitionQueueEntry = {
      id: `offline-${job.id}`,
      job,
      queuedAt: Date.now(),
      retries: 0,
    };
    this.offlineQueue.push(entry);
    this.saveOfflineQueue();
    this.log('Added to offline queue', { jobId: job.id, queueLength: this.offlineQueue.length });
  }

  /**
   * Remove job from offline queue
   */
  private removeFromOfflineQueue(jobId: string): void {
    this.offlineQueue = this.offlineQueue.filter(e => e.job.id !== jobId);
    this.saveOfflineQueue();
  }

  /**
   * Called when a stroke is added to a cell
   * Updates revision and schedules recognition
   */
  strokeAdded(cellId: string, cellCoords: CellCoordinates, strokes: Stroke[]): void {
    // Increment cell revision
    const newRevision = (this.cellRevisions.get(cellId) || 0) + 1;
    this.cellRevisions.set(cellId, newRevision);

    // Update cell state - has pending strokes
    this.updateCellState(cellId, {
      hasPendingStrokes: true,
      recognitionStatus: 'pending',
    });

    // Cancel any existing timer for this cell
    this.cancelPendingTimer(cellId);

    // Get column info for recognition context
    const column = this.ledgerConfig.columns[cellCoords.columnIndex];
    const columnType = column?.type;
    const columnLabel = column?.label;

    // Schedule recognition after quiet period
    const timerId = setTimeout(() => {
      this.pendingTimers.delete(cellId);
      this.scheduleRecognition(cellId, cellCoords, strokes, newRevision, columnType, columnLabel);
    }, this.config.quietPeriodMs);

    this.pendingTimers.set(cellId, timerId);

    this.log('Stroke added, recognition scheduled', {
      cellId,
      revision: newRevision,
      strokeCount: strokes.length,
      quietPeriodMs: this.config.quietPeriodMs,
    });
  }

  /**
   * Called when strokes are removed from a cell (eraser)
   * Invalidates current recognition and reschedules
   */
  strokesRemoved(cellId: string, cellCoords: CellCoordinates, remainingStrokes: Stroke[]): void {
    // Increment revision to invalidate previous recognition
    const newRevision = (this.cellRevisions.get(cellId) || 0) + 1;
    this.cellRevisions.set(cellId, newRevision);

    // If no strokes remain, clear recognition state
    if (remainingStrokes.length === 0) {
      this.updateCellState(cellId, {
        recognizedText: '',
        recognitionStatus: 'idle',
        recognitionRevision: newRevision,
        hasPendingStrokes: false,
        recognitionError: undefined,
      });
      this.cancelPendingTimer(cellId);
      this.cancelActiveJob(cellId);
      this.log('Cell cleared, recognition reset', { cellId, revision: newRevision });
      return;
    }

    // Update state - has pending strokes, recognition invalidated
    this.updateCellState(cellId, {
      hasPendingStrokes: true,
      recognitionStatus: 'pending',
      recognitionError: undefined,
    });

    // Cancel any existing timer
    this.cancelPendingTimer(cellId);

    // Get column info
    const column = this.ledgerConfig.columns[cellCoords.columnIndex];
    const columnType = column?.type;
    const columnLabel = column?.label;

    // Schedule new recognition
    const timerId = setTimeout(() => {
      this.pendingTimers.delete(cellId);
      this.scheduleRecognition(cellId, cellCoords, remainingStrokes, newRevision, columnType, columnLabel);
    }, this.config.quietPeriodMs);

    this.pendingTimers.set(cellId, timerId);

    this.log('Strokes removed, recognition rescheduled', {
      cellId,
      revision: newRevision,
      remainingStrokes: remainingStrokes.length,
    });
  }

  /**
   * Called when cell selection changes - finalize any pending recognition
   */
  cellSelectionChanged(newCellId: string | null): void {
    // Optionally finalize immediately for the previous cell
    // For now, we let the quiet period timer handle it
    this.log('Cell selection changed', { newCellId });
  }

  /**
   * Schedule a recognition job for a cell
   */
  private scheduleRecognition(
    cellId: string,
    cellCoords: CellCoordinates,
    strokes: Stroke[],
    revision: number,
    columnType?: LedgerColumnType,
    columnLabel?: string
  ): void {
    // Double-check revision hasn't changed since scheduling
    if (this.cellRevisions.get(cellId) !== revision) {
      this.log('Skipping recognition - revision changed', { cellId, expected: revision, current: this.cellRevisions.get(cellId) });
      return;
    }

    // Check if we already have an active job for this cell at this revision
    const existingJob = this.activeJobs.get(cellId);
    if (existingJob && existingJob.job.cellRevision === revision) {
      this.log('Skipping recognition - job already active for this revision', { cellId, revision });
      return;
    }

    // Filter to only pen strokes for this cell
    const cellStrokes = strokes.filter(s => s.tool === 'pen' && s.cell_id === cellId);

    if (cellStrokes.length === 0) {
      this.log('No pen strokes to recognize', { cellId });
      this.updateCellState(cellId, {
        hasPendingStrokes: false,
        recognitionStatus: 'idle',
      });
      return;
    }

    // Create recognition job
    const job: RecognitionJob = {
      id: `job-${cellId}-${revision}-${Date.now()}`,
      bookId: this.bookId,
      pageId: this.pageId,
      cellId,
      cellCoords,
      columnType,
      columnLabel,
      strokes: cellStrokes,
      cellRevision: revision,
      status: 'pending',
      attemptCount: 0,
      maxRetries: this.config.maxRetries,
      createdAt: Date.now(),
    };

    this.log('Recognition job created', { jobId: job.id, cellId, revision, strokeCount: cellStrokes.length });

    // Add to queue
    this.enqueueJob(job);
  }

  /**
   * Add job to processing queue
   */
  private enqueueJob(job: RecognitionJob): void {
    // If offline, add to offline queue instead
    if (!this.isOnline()) {
      job.status = 'queued';
      this.addToOfflineQueue(job);
      this.updateCellState(job.cellId, {
        recognitionStatus: 'queued',
        pendingJobId: job.id,
      });
      this.log('Job queued offline', { jobId: job.id });
      return;
    }

    this.jobQueue.push(job);
    this.processQueue();
  }

  /**
   * Process the job queue respecting concurrency limit
   */
  private async processQueue(): Promise<void> {
    // Don't process if offline
    if (!this.isOnline()) {
      return;
    }

    while (this.jobQueue.length > 0 && this.runningJobCount < this.config.maxConcurrentJobs) {
      const job = this.jobQueue.shift()!;
      this.executeJob(job);
    }
  }

  /**
   * Execute a recognition job
   */
  private async executeJob(job: RecognitionJob): Promise<void> {
    const jobState: JobState = {
      job,
      timerId: null,
      abortController: new AbortController(),
    };

    this.activeJobs.set(job.cellId, jobState);
    this.runningJobCount++;

    // Update job status
    job.status = 'recognizing';
    job.startedAt = Date.now();
    job.attemptCount++;

    this.updateCellState(job.cellId, {
      recognitionStatus: 'recognizing',
      pendingJobId: job.id,
    });

    this.log('Starting recognition', { jobId: job.id, cellId: job.cellId, attempt: job.attemptCount });

    // AbortController should always exist here since we create it just above
    if (!jobState.abortController) {
      throw new Error('AbortController not initialized');
    }
    try {
      const result = await this.callRecognitionApi(job, jobState.abortController.signal);

      if (result.success) {
        // Check revision hasn't changed (race condition protection)
        const currentRevision = this.cellRevisions.get(job.cellId);
        if (currentRevision !== job.cellRevision) {
          this.log('Stale result discarded - revision changed', {
            jobId: job.id,
            jobRevision: job.cellRevision,
            currentRevision,
          });
          // Result is stale, don't apply. Schedule new recognition if there are pending strokes.
          this.updateCellState(job.cellId, {
            recognitionStatus: 'pending',
            pendingJobId: undefined,
          });
          // Re-schedule for current revision
          this.scheduleRecognition(
            job.cellId,
            job.cellCoords,
            job.strokes,
            currentRevision || job.cellRevision,
            job.columnType,
            job.columnLabel
          );
          return;
        }

        // Apply successful result
        job.status = 'recognized';
        job.completedAt = Date.now();
        job.recognizedText = result.text;
        job.myscriptMetadata = result.metadata;

        this.updateCellState(job.cellId, {
          recognizedText: result.text || '',
          recognitionStatus: 'recognized',
          recognitionRevision: job.cellRevision,
          recognizedAt: job.completedAt,
          hasPendingStrokes: false,
          recognitionError: undefined,
          pendingJobId: undefined,
        });

        this.log('Recognition successful', {
          jobId: job.id,
          cellId: job.cellId,
          text: result.text,
          revision: job.cellRevision,
        });

        this.onRecognitionComplete?.(job.cellId, {
          success: true,
          text: result.text,
          cellRevision: job.cellRevision,
          metadata: result.metadata,
        });

        // Remove from offline queue on success
        this.removeFromOfflineQueue(job.id);
      } else {
        // Recognition failed - retry or mark failed
        await this.handleJobFailure(job, jobState, result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown_error';
      await this.handleJobFailure(job, jobState, errorMessage);
    } finally {
      this.activeJobs.delete(job.cellId);
      this.runningJobCount--;
      this.processQueue();
    }
  }

  /**
   * Call the recognition API
   */
  private async callRecognitionApi(
    job: RecognitionJob,
    signal: AbortSignal
  ): Promise<RecognitionResult> {
    const response = await fetch('/api/ink/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookId: job.bookId,
        pageId: job.pageId,
        cellId: job.cellId,
        cellCoords: job.cellCoords,
        columnType: job.columnType,
        columnLabel: job.columnLabel,
        strokes: job.strokes,
        cellRevision: job.cellRevision,
        language: this.config.language,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      text: data.recognizedText,
      error: data.error,
      cellRevision: data.cellRevision,
      metadata: data.metadata,
    };
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleJobFailure(
    job: RecognitionJob,
    jobState: JobState,
    error: string | undefined
  ): Promise<void> {
    job.error = error;

    if (job.attemptCount < job.maxRetries) {
      // Schedule retry with exponential backoff
      const delay = Math.min(
        this.config.retryBaseDelayMs * Math.pow(2, job.attemptCount - 1),
        this.config.retryMaxDelayMs
      );

      this.log('Recognition failed, scheduling retry', {
        jobId: job.id,
        attempt: job.attemptCount,
        maxRetries: job.maxRetries,
        delayMs: delay,
        error,
      });

      job.status = 'pending';

      jobState.timerId = setTimeout(() => {
        this.enqueueJob(job);
      }, delay);

      // Update cell state to show pending retry
      this.updateCellState(job.cellId, {
        recognitionStatus: 'pending',
        recognitionError: error,
        pendingJobId: job.id,
      });
    } else {
      // Max retries exceeded - mark as failed
      job.status = 'failed';
      job.completedAt = Date.now();

      this.updateCellState(job.cellId, {
        recognitionStatus: 'failed',
        recognitionError: error,
        hasPendingStrokes: false,
        pendingJobId: undefined,
      });

      this.log('Recognition failed permanently', {
        jobId: job.id,
        cellId: job.cellId,
        error,
      });

      this.onRecognitionComplete?.(job.cellId, {
        success: false,
        error,
        cellRevision: job.cellRevision,
      });
    }
  }

  /**
   * Cancel pending timer for a cell
   */
  private cancelPendingTimer(cellId: string): void {
    const timerId = this.pendingTimers.get(cellId);
    if (timerId) {
      clearTimeout(timerId);
      this.pendingTimers.delete(cellId);
    }
  }

  /**
   * Cancel active job for a cell
   */
  private cancelActiveJob(cellId: string): void {
    const jobState = this.activeJobs.get(cellId);
    if (jobState) {
      jobState.abortController?.abort();
      if (jobState.timerId) {
        clearTimeout(jobState.timerId);
      }
      this.activeJobs.delete(cellId);
      this.runningJobCount = Math.max(0, this.runningJobCount - 1);
    }
  }

  /**
   * Update cell recognition state and notify listeners
   */
  private updateCellState(cellId: string, partialState: Partial<CellRecognitionState>): void {
    const currentState = this.cellStates.get(cellId) || {
      recognitionStatus: 'idle' as RecognitionStatus,
      recognitionRevision: 0,
      recognizedText: '',
      hasPendingStrokes: false,
    };

    const newState: CellRecognitionState = {
      ...currentState,
      ...partialState,
    };

    this.cellStates.set(cellId, newState);
    this.onCellStateChange?.(cellId, newState);
  }

  /**
   * Get current cell recognition state
   */
  getCellState(cellId: string): CellRecognitionState | undefined {
    return this.cellStates.get(cellId);
  }

  /**
   * Get current cell revision
   */
  getCellRevision(cellId: string): number {
    return this.cellRevisions.get(cellId) || 0;
  }

  /**
   * Set initial cell revision during hydration from stored content
   * Used when loading existing page content to initialize revision tracking
   */
  setCellRevisionForInit(cellId: string, revision: number): void {
    // Only set if not already set (first initialization)
    if (!this.cellRevisions.has(cellId)) {
      this.cellRevisions.set(cellId, revision);
      this.log('Initialized cell revision from stored content', { cellId, revision });
    }
  }

  /**
   * Handle online event - process offline queue
   */
  private handleOnline(): void {
    this.log('Online - processing offline queue');
    this.processOfflineQueue();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.log('Offline - recognition queued locally');
    // Jobs will be queued internally and processed when online
  }

  /**
   * Process any pending offline jobs (called when coming online)
   */
  processOfflineQueue(): void {
    if (this.isProcessingOfflineQueue) {
      return;
    }

    this.isProcessingOfflineQueue = true;
    this.log('Processing offline queue', { count: this.offlineQueue.length });

    // Move offline jobs back to main queue
    for (const entry of this.offlineQueue) {
      entry.job.status = 'pending';
      this.jobQueue.push(entry.job);
    }

    // Clear offline queue
    this.offlineQueue = [];
    this.saveOfflineQueue();

    this.isProcessingOfflineQueue = false;

    // Process the queue
    this.processQueue();
  }

  /**
   * Shutdown the service
   */
  destroy(): void {
    // Clear all timers
    for (const timerId of Array.from(this.pendingTimers.values())) {
      clearTimeout(timerId);
    }
    this.pendingTimers.clear();

    // Abort all active jobs
    for (const jobState of Array.from(this.activeJobs.values())) {
      jobState.abortController?.abort();
      if (jobState.timerId) {
        clearTimeout(jobState.timerId);
      }
    }
    this.activeJobs.clear();
    this.jobQueue = [];
    this.runningJobCount = 0;

    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }

    this.log('RecognitionService destroyed');
  }

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[RecognitionService] ${message}`, data);
    }
  }
}

/**
 * Hook for using RecognitionService in React components
 */
export function createRecognitionService(config: RecognitionServiceConfig): RecognitionService {
  return new RecognitionService(config);
}