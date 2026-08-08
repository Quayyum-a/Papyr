import { useState, useCallback, useRef, useEffect } from 'react';
import { useInkEngine } from './useInkEngine';
import { useCellSelection } from '@/components/ledger-workspace/useCellSelection';
import { useLedgerConfig } from '@/components/ledger-workspace/useLedgerConfig';
import { DEFAULT_LEDGER_CONFIG, type LedgerPageContent, type LedgerConfig, type LedgerColumn } from '@/types/ledger';
import type { RawPoint } from '@/lib/ink-engine/types';

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
  
  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

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
