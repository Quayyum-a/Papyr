'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { LEDGER_CONSTANTS, type LedgerConfig, type CellCoordinates, type LedgerCellData, getCellId } from '@/types/ledger';
import { CalendarPicker } from '@/components/ledger-workspace/CalendarPicker';
import { CandidateStrip } from '@/components/ledger-workspace/CandidateStrip';
import { StrokeRenderer } from '@/lib/ink-engine/stroke-renderer';
import { PEN_CONFIGS, type RawPoint, type Stroke, type PenSize } from '@/lib/ink-engine/types';
import { v4 as uuidv4 } from 'uuid';

interface MobileCellEditorProps {
  ledgerConfig: LedgerConfig;
  cells: Record<string, LedgerCellData>;
  selectedCell: CellCoordinates | null;
  onCellValueChange: (cellId: string, value: string, contentType: LedgerCellData['content_type']) => void;
  onClose: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  isOpen: boolean;
}

interface WhiteboardStroke {
  id: string;
  points: RawPoint[];
  segments: ReturnType<StrokeRenderer['renderStroke']>;
  createdAt: number;
}

const DEFAULT_PEN_SIZE: PenSize = 'medium';
const DEFAULT_PEN_COLOR = '#000000';

/**
 * Mobile bottom sheet editor for cell content - Handwriting Whiteboard
 * Features:
 * - Large canvas for finger/stylus writing (replaces text input)
 * - Real-time ink capture with premium stroke rendering
 * - Automatic handwriting recognition via MyScript
 * - Candidate strip showing recognition alternatives
 * - Clear action to wipe canvas and start over
 * - Calendar picker for date columns (unchanged)
 * - Keyboard-avoiding behavior
 * - Swipe-down to dismiss
 * - Backdrop tap to close
 * - Focus trap for accessibility
 */
export function MobileCellEditor({
  ledgerConfig,
  cells,
  selectedCell,
  onCellValueChange,
  onClose,
  scrollContainerRef,
  isOpen,
}: MobileCellEditorProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [editValue, setEditValue] = useState('');
  const [editCellId, setEditCellId] = useState<string | null>(null);
  const [editColumnType, setEditColumnType] = useState<'text' | 'number' | 'date'>('text');
  const [showCalendar, setShowCalendar] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Whiteboard state
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<RawPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Refs for stroke rendering
  const rendererRef = useRef<StrokeRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  // Focus trap refs
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  // Keyboard-avoiding: track viewport height changes
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const fullHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = fullHeight - viewportHeight;
      setKeyboardHeight(heightDiff > 150 ? heightDiff : 0);
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleResize);
      handleResize();
      return () => vv.removeEventListener('resize', handleResize);
    }
  }, []);

  // Initialize editor when opened
  useEffect(() => {
    if (isOpen && selectedCell) {
      const cellId = getCellId(selectedCell);
      const cellData = cells[cellId];
      const column = ledgerConfig.columns[selectedCell.columnIndex];
      const columnType = column?.type || 'text';

      setEditCellId(cellId);
      setEditColumnType(columnType);
      setEditValue(cellData?.value || '');
      setShowCalendar(columnType === 'date');

      // Load existing candidates if any
      if (cellData?.candidates?.length) {
        setCandidates(cellData.candidates);
      }

      // Store previous focus for restoration
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus first focusable element after render
      setTimeout(() => firstFocusableRef.current?.focus(), 100);
    } else {
      // Reset state on close
      setEditCellId(null);
      setEditValue('');
      setShowCalendar(false);
      setWhiteboardStrokes([]);
      setCurrentPoints([]);
      setCandidates([]);
      setIsRecognizing(false);

      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen, selectedCell, cells, ledgerConfig]);

  // Initialize stroke renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale for DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    rendererRef.current = new StrokeRenderer({
      color: DEFAULT_PEN_COLOR,
      ...PEN_CONFIGS[DEFAULT_PEN_SIZE],
    });

    // Initial render
    renderCanvas();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (!canvasRef.current) return;
      const newCanvas = canvasRef.current;
      const newCtx = newCanvas.getContext('2d');
      if (!newCtx || !rendererRef.current) return;

      const dpr = window.devicePixelRatio || 1;
      newCanvas.width = newCanvas.clientWidth * dpr;
      newCanvas.height = newCanvas.clientHeight * dpr;
      newCtx.scale(dpr, dpr);
      newCtx.imageSmoothingEnabled = true;
      newCtx.imageSmoothingQuality = 'high';
      renderCanvas();
    });
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      const frameId = animationFrameRef.current;
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  // Render canvas function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw paper-like background (subtle grid or lines)
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;
    const lineSpacing = 24;
    for (let y = lineSpacing; y < height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw completed strokes
    for (const stroke of whiteboardStrokes) {
      ctx.fillStyle = DEFAULT_PEN_COLOR;
      for (const segment of stroke.segments) {
        renderer.drawSegment(ctx, segment);
      }
    }

    // Draw current stroke (being drawn)
    if (currentPoints.length > 1) {
      const tailSegments = renderer.renderStrokeTail(currentPoints);
      ctx.fillStyle = DEFAULT_PEN_COLOR;
      for (const segment of tailSegments) {
        renderer.drawSegment(ctx, segment, 10);
      }
    }
  }, [whiteboardStrokes, currentPoints]);

  // Trigger canvas re-render when strokes change
  useEffect(() => {
    renderCanvas();
  }, [whiteboardStrokes, currentPoints]);

  // Focus trap implementation
  const updateFocusableElements = useCallback(() => {
    if (!sheetRef.current) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const elements = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(focusableSelector))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

    focusableElementsRef.current = elements;
    firstFocusableRef.current = elements[0] || null;
    lastFocusableRef.current = elements[elements.length - 1] || null;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updateFocusableElements();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    };

    const sheetEl = sheetRef.current;
    sheetEl?.addEventListener('keydown', handleTab);
    return () => sheetEl?.removeEventListener('keydown', handleTab);
  }, [isOpen, updateFocusableElements]);

  // Handle swipe down to dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || dragStartY === null) return;

    const deltaY = e.touches[0].clientY - dragStartY;
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  }, [isDragging, dragStartY]);

  const handleTouchEnd = useCallback(() => {
    if (dragOffset > 100) {
      onClose();
    }
    setDragStartY(null);
    setDragOffset(0);
    setIsDragging(false);
  }, [dragOffset, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleSave = useCallback(() => {
    if (!editCellId) return;

    if (editValue.trim() !== '') {
      let contentType: LedgerCellData['content_type'] = 'text';
      if (editColumnType === 'number') contentType = 'number';
      else if (editColumnType === 'date') contentType = 'text';

      onCellValueChange(editCellId, editValue.trim(), contentType);
    }
    onClose();
  }, [editCellId, editValue, editColumnType, onCellValueChange, onClose]);

  // Handle canvas pointer events for drawing
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Ignore if another pointer is already active
    if (activePointerIdRef.current !== null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    activePointerIdRef.current = e.pointerId;
    setIsDrawing(true);

    // Try to capture pointer
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if capture fails
    }

    const point: RawPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      t: Date.now(),
      pressure: e.pressure,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
    };

    setCurrentPoints([point]);
  }, []);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const point: RawPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      t: Date.now(),
      pressure: e.pressure,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
    };

    setCurrentPoints(prev => [...prev, point]);
  }, [isDrawing]);

  // Submit stroke to recognition pipeline - must be defined before handleCanvasPointerUp
  const submitStrokeForRecognition = useCallback(async (stroke: WhiteboardStroke, cellId: string, cellCoords: CellCoordinates) => {
    if (!cellId) return;

    setIsRecognizing(true);

    // Convert WhiteboardStroke to the format expected by RecognitionService
    const bounds = {
      minX: Math.min(...stroke.points.map(p => p.x)),
      minY: Math.min(...stroke.points.map(p => p.y)),
      maxX: Math.max(...stroke.points.map(p => p.x)),
      maxY: Math.max(...stroke.points.map(p => p.y)),
    };

    const inkStroke: Stroke = {
      id: stroke.id,
      tool: 'pen',
      color: DEFAULT_PEN_COLOR,
      size: DEFAULT_PEN_SIZE,
      segments: stroke.segments,
      createdAt: stroke.createdAt,
      bounds,
      cell_id: cellId,
    };

    // For now, we'll simulate the recognition call
    // In production, this would go through the RecognitionService
    // which calls /api/ink/recognize endpoint
    try {
      const response = await fetch('/api/ink/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: 'default', // Would come from context
          pageId: 'default', // Would come from context
          cellId,
          cellCoords,
          columnType: editColumnType,
          columnLabel: ledgerConfig.columns[cellCoords.columnIndex]?.label,
          strokes: [inkStroke],
          cellRevision: 1,
          language: 'en_US',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.recognizedText) {
          setEditValue(data.recognizedText);
        }
        if (data.metadata?.candidates?.length) {
          setCandidates(data.metadata.candidates);
        }
      }
    } catch (error) {
      console.error('Recognition failed:', error);
    } finally {
      setIsRecognizing(false);
    }
  }, [editColumnType, ledgerConfig.columns]);

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;

    const canvas = canvasRef.current;

    // Release pointer capture
    try {
      canvas?.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    activePointerIdRef.current = null;

    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }

    // Create stroke from points
    const renderer = rendererRef.current;
    if (!renderer) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }

    const segments = renderer.renderStroke(currentPoints);

    const bounds = {
      minX: Math.min(...currentPoints.map(p => p.x)),
      minY: Math.min(...currentPoints.map(p => p.y)),
      maxX: Math.max(...currentPoints.map(p => p.x)),
      maxY: Math.max(...currentPoints.map(p => p.y)),
    };

    const newStroke: WhiteboardStroke = {
      id: uuidv4(),
      points: currentPoints,
      segments,
      createdAt: Date.now(),
    };

    setWhiteboardStrokes(prev => [...prev, newStroke]);
    setCurrentPoints([]);
    setIsDrawing(false);

    // Submit stroke for recognition
    if (editCellId && selectedCell) {
      submitStrokeForRecognition(newStroke, editCellId, selectedCell);
    }
  }, [isDrawing, currentPoints, editCellId, selectedCell, submitStrokeForRecognition]);

  const handleCanvasPointerLeave = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current === e.pointerId && isDrawing) {
      handleCanvasPointerUp(e);
    }
  }, [isDrawing, handleCanvasPointerUp]);

  // Clear canvas and recognition state
  const handleClear = useCallback(() => {
    setWhiteboardStrokes([]);
    setCurrentPoints([]);
    setEditValue('');
    setCandidates([]);
    setIsRecognizing(false);

    // Also clear the cell value if we want to truly reset
    if (editCellId) {
      onCellValueChange(editCellId, '', 'text');
    }
  }, [editCellId, onCellValueChange]);

  // Handle candidate selection from CandidateStrip
  const handleCandidateSelect = useCallback((candidate: string) => {
    setEditValue(candidate);
  }, []);

  // Handle date selection from calendar
  const handleDateSelect = useCallback((cellId: string, date: Date) => {
    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setEditValue(formatted);
    let contentType: LedgerCellData['content_type'] = 'text';
    if (editColumnType === 'date') contentType = 'text';
    onCellValueChange(cellId, formatted, contentType);
    setShowCalendar(false);
  }, [editColumnType, onCellValueChange]);

  const handleCalendarClose = useCallback(() => {
    setShowCalendar(false);
  }, []);

  // Compute column info
  const column = useMemo(
    () => (selectedCell ? ledgerConfig.columns[selectedCell.columnIndex] : null),
    [ledgerConfig, selectedCell]
  );
  const isDateColumn = column?.type === 'date';

  // Sheet height: 50% of viewport on mobile, max 600px on tablet
  const sheetHeight = keyboardHeight > 0
    ? `calc(100vh - ${keyboardHeight}px - 20px)`
    : '50vh';

  const headerTitle = `Edit ${column?.label || 'Cell'}`;

  if (!isOpen || !selectedCell) return null;

  // Render content based on state
  const renderContent = () => {
    if (showCalendar) {
      return (
        <CalendarPicker
          ledgerConfig={ledgerConfig}
          selectedCell={selectedCell}
          cells={cells}
          onDateSelect={handleDateSelect}
          onClose={handleCalendarClose}
          scrollContainerRef={scrollContainerRef}
        />
      );
    }

    if (isDateColumn) {
      // Date columns still show calendar picker as primary, but allow handwriting too
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Tap calendar or write the date below
          </p>
          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            className="w-full px-4 py-3 text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Calendar
          </button>
          <WhiteboardCanvas
            canvasRef={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={handleCanvasPointerLeave}
            isDrawing={isDrawing}
            isRecognizing={isRecognizing}
          />
          {whiteboardStrokes.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Canvas
            </button>
          )}
        </div>
      );
    }

    // Text and number columns: Full whiteboard
    return (
      <div className="space-y-4 flex flex-col h-full">
        <div className="text-center text-sm text-gray-500 mb-2">
          Write naturally with finger or stylus
        </div>

        <WhiteboardCanvas
          canvasRef={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerLeave}
          isDrawing={isDrawing}
          isRecognizing={isRecognizing}
        />

        {whiteboardStrokes.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors self-center"
          >
            Clear Canvas
          </button>
        )}

        {/* Candidate Strip - shows MyScript alternates */}
        {candidates.length > 0 && (
          <CandidateStrip
            ledgerConfig={ledgerConfig}
            cells={{ [editCellId!]: { cellId: editCellId!, value: editValue, content_type: 'text', candidates } }}
            selectedCell={selectedCell}
            onCandidateSelect={handleCandidateSelect}
            scrollContainerRef={scrollContainerRef}
            maxCandidates={5}
          />
        )}
      </div>
    );
  };

  const renderActionButtons = () => {
    if (showCalendar) return null;

    return (
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onClose()}
          className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={editValue.trim() === '' && whiteboardStrokes.length === 0}
          className="flex-1 px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRecognizing ? 'Recognizing...' : 'Save'}
        </button>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${column?.label || 'cell'}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-xl transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${dragOffset}px)`,
          maxHeight: sheetHeight,
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        {/* Drag handle - swipe down from here to dismiss */}
        <div
          className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4"
          aria-hidden="true"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Header */}
        <div className="px-4 mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{headerTitle}</h2>
          <div className="flex items-center gap-2">
            {isDateColumn && !showCalendar && (
              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Calendar
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: `calc(${sheetHeight} - 120px)` } as React.CSSProperties}>
          {renderContent()}
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
}

// Separate canvas component to avoid re-render issues
interface WhiteboardCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  isDrawing: boolean;
  isRecognizing: boolean;
}

function WhiteboardCanvas({
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  isDrawing,
  isRecognizing,
}: WhiteboardCanvasProps) {
  return (
    <div className="relative w-full" style={{ flex: 1, minHeight: 200, maxHeight: 400 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-white border-2 border-gray-200 rounded-lg touch-none cursor-crosshair"
        style={{
          minHeight: 200,
          maxHeight: 400,
          height: '100%',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
      />
      {isRecognizing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/80 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Recognizing...</p>
          </div>
        </div>
      )}
    </div>
  );
}