import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useInkEngine } from './useInkEngine';
import { useCellSelection } from '@/components/ledger-workspace/useCellSelection';
import { useLedgerConfig } from '@/components/ledger-workspace/useLedgerConfig';
import { DEFAULT_LEDGER_CONFIG, type LedgerPageContent, type LedgerConfig, type LedgerColumn, type LedgerCellData, getCellId, type CellCoordinates } from '@/types/ledger';
import type { RawPoint, Stroke } from '@/lib/ink-engine/types';
import { HandwritingSessionManager } from '@/lib/handwriting-session';
import { RecognitionService } from '@/lib/recognition';
import type { RecognitionConfig, CellRecognitionState } from '@/lib/recognition/types';

interface UseLedgerWorkspaceOptions {
  bookId: string;
  pageId: string | null;
  initialContent?: LedgerPageContent;
  onSave?: (content: LedgerPageContent) => Promise<void>;
}

/**
 * Ensure ledger config columns have IDs
 * Database-loaded configs should already have IDs, but DEFAULT_LEDGER_CONFIG does not
 */
function ensureColumnIds(config: { columns: Array<Omit<LedgerColumn, 'id'> & { id?: string }>; rowCount: number }): LedgerConfig {
  return {
    rowCount: config.rowCount,
    columns: config.columns.map((col, idx) => ({
      ...col,
      id: col.id || `default-col-${idx}`,
    })) as LedgerColumn[],
  };
}

/**
 * Main hook for ledger workspace
 * Combines ink engine, cell selection, and column management
 */
export function useLedgerWorkspace({
  bookId,
  pageId,
  initialContent,
  onSave,
}: UseLedgerWorkspaceOptions) {
  // Ink engine
  const inkEngine = useInkEngine();

  // Cell selection
  const cellSelection = useCellSelection();

  // Ledger configuration - ensure columns have IDs
  const ledgerConfig = useLedgerConfig(
    initialContent?.ledger ? ensureColumnIds(initialContent.ledger) : ensureColumnIds(DEFAULT_LEDGER_CONFIG)
  );

  // Drawing state
  const [currentPoints, setCurrentPoints] = useState<RawPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Recognition state
  const [recognizingCells, setRecognizingCells] = useState<Set<string>>(new Set());

  // Cell data state (recognized text and typed values)
  const [cells, setCells] = useState<Record<string, LedgerCellData>>(
    initialContent?.cells || {}
  );

  // Calendar picker state
  const [calendarPickerCell, setCalendarPickerCell] = useState<{ cellId: string; columnIndex: number; rowIndex: number } | null>(null);

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Handwriting session manager (groups strokes into segments)
  const sessionManager = useMemo(() => {
    const manager = new HandwritingSessionManager();
    manager.setDebugMode(true); // Enable debug logging
    return manager;
  }, []);

  // Recognition service (handles automatic per-cell recognition with MyScript)
  const recognitionService = useMemo(() => {
    const service = new RecognitionService({
      bookId,
      pageId: pageId || '',
      ledgerConfig: ledgerConfig.ledgerConfig,
      quietPeriodMs: 1000,
      maxConcurrentJobs: 2,
      maxRetries: 3,
      retryBaseDelayMs: 1000,
      retryMaxDelayMs: 10000,
      language: 'en_US',
      debug: process.env.NODE_ENV === 'development',
      onCellStateChange: (cellId, state) => {
        // Update cells state with recognition info
        setCells(prev => ({
          ...prev,
          [cellId]: {
            cellId,
            value: state.recognizedText || (state.recognitionStatus === 'failed' ? '' : prev[cellId]?.value || ''),
            // Show raw ink while recognition is pending/recognizing; only show ink icon on failure
            content_type: state.recognitionStatus === 'recognized' ? 'text' :
                         state.recognitionStatus === 'failed' ? 'ink' : 'empty',
          } as LedgerCellData,
        }));

        // Update recognizingCells set
        setRecognizingCells(prev => {
          const next = new Set(prev);
          if (state.recognitionStatus === 'recognizing' || state.recognitionStatus === 'pending') {
            next.add(cellId);
          } else {
            next.delete(cellId);
          }
          return next;
        });
      },
      onRecognitionComplete: (cellId, result) => {
        console.log('[INK] Recognition complete', { cellId, success: result.success, text: result.text, error: result.error });

        // Store candidates from MyScript recognition metadata
        if (result.success && result.metadata?.candidates && result.metadata.candidates.length > 0) {
          const candidates = result.metadata.candidates;
          setCells(prev => ({
            ...prev,
            [cellId]: {
              ...prev[cellId],
              cellId,
              candidates,
            } as LedgerCellData,
          }));
        }
      },
      isOnline: () => navigator.onLine,
    });
    return service;
  }, [bookId, pageId, ledgerConfig.ledgerConfig]);

  // Load initial strokes when content is provided
  useEffect(() => {
    if (initialContent?.strokes && initialContent.strokes.length > 0) {
      // Load all strokes at once using loadStrokes method
      inkEngine.loadStrokes(initialContent.strokes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent?.strokes]);

  // Load initial cells when content is provided
  // This handles the case where initialContent arrives after initial render (e.g., async page load)
  useEffect(() => {
    if (initialContent?.cells && Object.keys(initialContent.cells).length > 0) {
      setCells(initialContent.cells);

      // Initialize cell revisions from existing recognition state
      // Revision = number of strokes in the cell (simple approach)
      const strokes = initialContent.strokes || [];
      const cellStrokeCounts: Record<string, number> = {};
      for (const stroke of strokes) {
        if (stroke.cell_id) {
          cellStrokeCounts[stroke.cell_id] = (cellStrokeCounts[stroke.cell_id] || 0) + 1;
        }
      }
      for (const [cellId, count] of Object.entries(cellStrokeCounts)) {
        // Only set revision if cell has recognized content
        if (initialContent.cells[cellId]?.content_type === 'text' || initialContent.cells[cellId]?.content_type === 'ink') {
          recognitionService.setCellRevisionForInit(cellId, count);
        }
      }
    }
  }, [initialContent?.cells, initialContent?.strokes, recognitionService]);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (!onSave) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout (500ms debounce)
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const content: LedgerPageContent = {
          strokes: inkEngine.strokes,
          ledger: ledgerConfig.ledgerConfig,
          cells,
        };
        await onSave(content);
      } catch (error) {
        console.error('Failed to save page:', error);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }, [onSave, inkEngine.strokes, ledgerConfig.ledgerConfig, cells]);

  // Trigger save when strokes, config, or cells change
  useEffect(() => {
    if (inkEngine.strokes.length > 0 || ledgerConfig.ledgerConfig.columns.length > 0 || Object.keys(cells).length > 0) {
      debouncedSave();
    }
  }, [inkEngine.strokes.length, ledgerConfig.ledgerConfig, cells, debouncedSave]);

  // Setup handwriting session event listeners for recognition
  useEffect(() => {
    // When a handwriting segment is finalized, trigger recognition via RecognitionService
    const unsubscribeSegment = sessionManager.onSegmentFinalized((event) => {
      const { segment, cellId } = event;

      console.log('[INK] SEGMENT_FINALIZED - Scheduling recognition', {
        segmentId: segment.id,
        strokeCount: segment.strokes.length,
        cellId,
      });

      // Get cell coordinates from cellId
      const match = cellId.match(/^col-(\d+)-row-(\d+)$/);
      if (!match) {
        console.error('[INK] Invalid cellId format:', cellId);
        return;
      }

      const cellCoords: CellCoordinates = {
        columnIndex: parseInt(match[1], 10),
        rowIndex: parseInt(match[2], 10),
      };

      // Delegate to RecognitionService for automatic scheduling with quiet period
      // The service handles debouncing, revision tracking, and MyScript API calls
      recognitionService.strokeAdded(cellId, cellCoords, segment.strokes);

      // Mark segment as recognized locally (to avoid duplicate processing by session manager)
      sessionManager.markSegmentRecognized(segment.id);
    });

    // When session completes, log summary
    const unsubscribeSession = sessionManager.onSessionComplete((event) => {
      console.log('[INK] SESSION_COMPLETE', {
        sessionId: event.session.id,
        cellId: event.session.cellId,
        totalStrokes: event.session.strokes.length,
        totalSegments: event.session.segments.length,
      });
    });

    return () => {
      unsubscribeSegment();
      unsubscribeSession();
    };
  }, [sessionManager, ledgerConfig.ledgerConfig, recognitionService]);

  // Start/update handwriting session when cell selection changes
  useEffect(() => {
    if (cellSelection.selectedCell && pageId) {
      const cellId = getCellId(cellSelection.selectedCell);
      sessionManager.startSession(cellId, cellSelection.selectedCell, pageId);
    }
    
    // Cleanup: end session when cell deselected
    return () => {
      if (cellSelection.selectedCell) {
        // Session will auto-finalize after timeout
        // Don't force-end here to allow natural timeout-based finalization
      }
    };
  }, [cellSelection.selectedCell, pageId, sessionManager]);

  // Pointer event handlers with scroll offset support
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore if another pointer is already active
    if (activePointerIdRef.current !== null) return;

    // Require an active cell selection to start drawing
    if (!cellSelection.selectedCell) return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();

    // Get scroll container to account for scroll offsets
    const scrollContainer = target.closest('[role="region"]')?.parentElement;
    const scrollLeft = scrollContainer?.scrollLeft || 0;
    const scrollTop = scrollContainer?.scrollTop || 0;

    // Calculate canvas-relative coordinates accounting for scroll
    const canvasX = e.clientX - rect.left + scrollLeft;
    const canvasY = e.clientY - rect.top + scrollTop;

    // Store start position for gesture detection
    pointerStartPositionRef.current = { x: e.clientX, y: e.clientY };

    activePointerIdRef.current = e.pointerId;
    setIsDrawing(true);

    // Try to capture pointer - captures on the container which spans the full visible canvas
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if capture fails
    }

    setCurrentPoints([{
      x: canvasX,
      y: canvasY,
      t: Date.now(),
      pressure: e.pressure,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
    }]);
  }, [cellSelection.selectedCell]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore if not the active pointer
    if (activePointerIdRef.current !== e.pointerId) return;
    if (!isDrawing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    
    // Get scroll container to account for scroll offsets
    const scrollContainer = e.currentTarget.closest('[role="region"]')?.parentElement;
    const scrollLeft = scrollContainer?.scrollLeft || 0;
    const scrollTop = scrollContainer?.scrollTop || 0;
    
    // Calculate canvas-relative coordinates accounting for scroll
    const canvasX = e.clientX - rect.left + scrollLeft;
    const canvasY = e.clientY - rect.top + scrollTop;
    
    setCurrentPoints(prev => [...prev, {
      x: canvasX,
      y: canvasY,
      t: Date.now(),
      pressure: e.pressure,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
    }]);
  }, [isDrawing]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore if not the active pointer
    if (activePointerIdRef.current !== e.pointerId) return;

    const target = e.currentTarget;

    // Release pointer capture
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if release fails
    }

    activePointerIdRef.current = null;

    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }

    // Create stroke with cell binding
    const stroke = inkEngine.createStroke(currentPoints);
    if (cellSelection.selectedCellId) {
      stroke.cell_id = cellSelection.selectedCellId;
    }

    // Add stroke to ink engine (for rendering and persistence)
    inkEngine.addStroke(stroke);

    // Add stroke to handwriting session (for intelligent grouping and recognition)
    sessionManager.addStroke(stroke);

    // Notify recognition service of new stroke for automatic scheduling
    if (cellSelection.selectedCellId && cellSelection.selectedCell) {
      const cellStrokes = inkEngine.strokes.filter(s => s.cell_id === cellSelection.selectedCellId);
      recognitionService.strokeAdded(cellSelection.selectedCellId, cellSelection.selectedCell, cellStrokes);
    }

    setIsDrawing(false);
    setCurrentPoints([]);
  }, [isDrawing, currentPoints, cellSelection.selectedCellId, cellSelection.selectedCell, inkEngine, sessionManager, recognitionService]);

  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle if this is the active pointer
    if (activePointerIdRef.current === e.pointerId && isDrawing) {
      handlePointerUp(e);
    }
  }, [isDrawing, handlePointerUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Cleanup session manager
      sessionManager.destroy();

      // Cleanup recognition service
      recognitionService.destroy();
    };
  }, [sessionManager, recognitionService]);

  // Open calendar picker for a date cell
  const openCalendarPicker = useCallback((columnIndex: number, rowIndex: number) => {
    const cellId = getCellId({ columnIndex, rowIndex });
    const cellData = cells[cellId];

    // Only open for date-type columns
    const column = ledgerConfig.ledgerConfig.columns[columnIndex];
    if (column?.type === 'date') {
      setCalendarPickerCell({ cellId, columnIndex, rowIndex });
    }
  }, [cells, ledgerConfig.ledgerConfig.columns]);

  // Close calendar picker
  const closeCalendarPicker = useCallback(() => {
    setCalendarPickerCell(null);
  }, []);

  // Set date for a cell from calendar picker
  const setCellDate = useCallback((cellId: string, date: Date) => {
    // Store as ISO format (YYYY-MM-DD) for consistency
    // Use local date components to avoid timezone shift bug
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    setCells(prevCells => ({
      ...prevCells,
      [cellId]: {
        cellId,
        value: formattedDate,
        content_type: 'text',
      },
    }));

    // Close picker after selection
    setCalendarPickerCell(null);
  }, []);

  // Set cell value from typed input (keyboard entry)
  const setCellValue = useCallback((cellId: string, value: string, contentType: LedgerCellData['content_type'] = 'text') => {
    setCells(prevCells => ({
      ...prevCells,
      [cellId]: {
        cellId,
        value,
        content_type: contentType,
      },
    }));
  }, []);

  return {
    // Ink engine
    ...inkEngine,
    
    // Cell selection
    ...cellSelection,
    
    // Ledger config
    ...ledgerConfig,
    
    // Drawing state
    currentPoints: isDrawing ? currentPoints : null,
    isDrawing,
    isSaving,
    
    // Recognition state
    recognizingCells,
    inkCanvasRef,
    
    // Cell data
    cells,
    getCellValue: useCallback((cellId: string) => cells[cellId]?.value, [cells]),

    // Calendar picker
    calendarPickerCell,
    openCalendarPicker,
    closeCalendarPicker,
    setCellDate,

    // Cell editing
    setCellValue,

    // Pointer handlers
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,

    // Metadata
    bookId,
    pageId,
  };
}
