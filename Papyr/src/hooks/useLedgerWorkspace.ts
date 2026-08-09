import { useState, useCallback, useRef, useEffect } from 'react';
import { useInkEngine } from './useInkEngine';
import { useCellSelection } from '@/components/ledger-workspace/useCellSelection';
import { useLedgerConfig } from '@/components/ledger-workspace/useLedgerConfig';
import { DEFAULT_LEDGER_CONFIG, type LedgerPageContent, type LedgerConfig, type LedgerColumn, getCellId } from '@/types/ledger';
import type { RawPoint } from '@/lib/ink-engine/types';
import { captureCellImage, cellHasInk, recognizeInk } from '@/lib/ink-recognition';

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
  const [lastRecognizedStrokeCount, setLastRecognizedStrokeCount] = useState<Map<string, number>>(new Map());
  
  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load initial strokes when content is provided
  useEffect(() => {
    if (initialContent?.strokes && initialContent.strokes.length > 0) {
      // Load all strokes at once using loadStrokes method
      inkEngine.loadStrokes(initialContent.strokes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent?.strokes]);

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
        };
        await onSave(content);
      } catch (error) {
        console.error('Failed to save page:', error);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }, [onSave, inkEngine.strokes, ledgerConfig.ledgerConfig]);

  // Trigger save when strokes or config changes
  useEffect(() => {
    if (inkEngine.strokes.length > 0 || ledgerConfig.ledgerConfig.columns.length > 0) {
      debouncedSave();
    }
  }, [inkEngine.strokes.length, ledgerConfig.ledgerConfig, debouncedSave]);

  // Function to trigger recognition for a cell
  const triggerRecognition = useCallback(async (cellCoords: typeof cellSelection.selectedCell) => {
    if (!cellCoords || !inkCanvasRef.current) return;

    const cellId = getCellId(cellCoords);
    
    // Don't trigger if already recognizing this cell
    if (recognizingCells.has(cellId)) return;

    // Mark as recognizing
    setRecognizingCells(prev => new Set(prev).add(cellId));

    try {
      // Capture cell image
      const imageData = captureCellImage(
        inkCanvasRef.current,
        ledgerConfig.ledgerConfig,
        cellCoords
      );

      if (!imageData) {
        console.warn('Failed to capture cell image');
        return;
      }

      // Get column label for context
      const column = ledgerConfig.ledgerConfig.columns[cellCoords.columnIndex];
      const columnLabel = column?.label;

      // Call recognition API
      const recognizedText = await recognizeInk(imageData, columnLabel);

      if (recognizedText !== null) {
        // Recognition succeeded - update last recognized count
        const currentStrokeCount = inkEngine.strokes.filter(s => s.cell_id === cellId).length;
        setLastRecognizedStrokeCount(prev => new Map(prev).set(cellId, currentStrokeCount));
        
        // TODO: Store recognized text in cell data structure
        // For now, just log it
        console.log(`Recognized text for ${cellId}:`, recognizedText);
      }
    } catch (error) {
      console.error('Recognition failed:', error);
    } finally {
      // Remove from recognizing set
      setRecognizingCells(prev => {
        const next = new Set(prev);
        next.delete(cellId);
        return next;
      });
    }
  }, [inkEngine.strokes, ledgerConfig.ledgerConfig, recognizingCells, lastRecognizedStrokeCount]);

  // Recognition: Trigger on cell change
  useEffect(() => {
    // When selected cell changes, recognize the previous cell if it has new ink
    const previousCell = cellSelection.selectedCell;
    
    return () => {
      if (previousCell && inkCanvasRef.current) {
        const cellId = getCellId(previousCell);
        
        // Check if cell has ink and hasn't been recognized since last stroke
        const currentStrokeCount = inkEngine.strokes.filter(s => s.cell_id === cellId).length;
        const lastCount = lastRecognizedStrokeCount.get(cellId) || 0;
        
        if (currentStrokeCount > lastCount && cellHasInk(inkEngine.strokes, cellId)) {
          triggerRecognition(previousCell);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellSelection.selectedCell]);

  // Recognition: Trigger after pause (1.5 seconds of no new strokes)
  useEffect(() => {
    if (!isDrawing && cellSelection.selectedCell && inkCanvasRef.current) {
      // Clear existing timeout
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }

      // Set new timeout for pause detection
      recognitionTimeoutRef.current = setTimeout(() => {
        if (cellSelection.selectedCell) {
          const cellId = getCellId(cellSelection.selectedCell);
          const currentStrokeCount = inkEngine.strokes.filter(s => s.cell_id === cellId).length;
          const lastCount = lastRecognizedStrokeCount.get(cellId) || 0;
          
          if (currentStrokeCount > lastCount && cellHasInk(inkEngine.strokes, cellId)) {
            triggerRecognition(cellSelection.selectedCell);
          }
        }
      }, 1500);
    }

    return () => {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing, inkEngine.strokes.length, cellSelection.selectedCell]);

  // Pointer event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore if another pointer is already active
    if (activePointerIdRef.current !== null) return;

    // Require an active cell selection to start drawing
    if (!cellSelection.selectedCell) return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();

    activePointerIdRef.current = e.pointerId;
    setIsDrawing(true);

    // Try to capture pointer
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if capture fails
    }

    setCurrentPoints([{
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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
    setCurrentPoints(prev => [...prev, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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
    
    inkEngine.addStroke(stroke);
    setIsDrawing(false);
    setCurrentPoints([]);
  }, [isDrawing, currentPoints, cellSelection.selectedCellId, inkEngine]);

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
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    };
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
