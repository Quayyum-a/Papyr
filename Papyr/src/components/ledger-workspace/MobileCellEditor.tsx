'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { LEDGER_CONSTANTS, type LedgerConfig, type CellCoordinates, type LedgerCellData, getCellId, getCellBounds } from '@/types/ledger';
import { CalendarPicker } from '@/components/ledger-workspace/CalendarPicker';

interface MobileCellEditorProps {
  ledgerConfig: LedgerConfig;
  cells: Record<string, LedgerCellData>;
  selectedCell: CellCoordinates | null;
  onCellValueChange: (cellId: string, value: string, contentType: LedgerCellData['content_type']) => void;
  onClose: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  isOpen: boolean;
  onToggleDrawingMode?: () => void;
  isDrawingMode?: boolean;
}

/**
 * Mobile bottom sheet editor for cell content
 * Features:
 * - Text input for cell editing
 * - Drawing canvas toggle for handwriting
 * - Calendar picker for date columns
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
  onToggleDrawingMode,
  isDrawingMode = false,
}: MobileCellEditorProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState('');
  const [editCellId, setEditCellId] = useState<string | null>(null);
  const [editColumnType, setEditColumnType] = useState<'text' | 'number' | 'date'>('text');
  const [showCalendar, setShowCalendar] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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
      // Approximate keyboard height when viewport shrinks
      const heightDiff = fullHeight - viewportHeight;
      setKeyboardHeight(heightDiff > 150 ? heightDiff : 0); // Threshold to avoid false positives
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleResize);
      handleResize(); // Initial check
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

      // Store previous focus for restoration
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus input after render
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state on close
      setEditCellId(null);
      setEditValue('');
      setShowCalendar(false);

      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen, selectedCell, cells, ledgerConfig]);

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
        // Shift+Tab: move backwards
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        // Tab: move forwards
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    };

    sheetRef.current?.addEventListener('keydown', handleTab);
    return () => sheetRef.current?.removeEventListener('keydown', handleTab);
  }, [isOpen, updateFocusableElements]);

  // Handle swipe down to dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || dragStartY === null) return;

    const deltaY = e.touches[0].clientY - dragStartY;
    if (deltaY > 0) { // Only allow dragging down
      setDragOffset(deltaY);
    }
  }, [isDragging, dragStartY]);

  const handleTouchEnd = useCallback(() => {
    if (dragOffset > 100) { // Threshold for dismiss
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
    } else if (e.key === 'Enter' && !e.shiftKey && !showCalendar) {
      // Enter to save (but not in calendar or multiline)
      e.preventDefault();
      handleSave();
    }
  }, [onClose, showCalendar]);

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  // Calendar date selection
  const handleDateSelect = useCallback((cellId: string, date: Date) => {
    // Use local date components to avoid timezone shift (same as useLedgerWorkspace.setCellDate)
    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setEditValue(formatted);
    let contentType: LedgerCellData['content_type'] = 'text';
    if (editColumnType === 'date') contentType = 'text';
    onCellValueChange(cellId, formatted, contentType);
    setShowCalendar(false);
  }, [editColumnType, onCellValueChange]);

  const handleCalendarClose = useCallback(() => {
    setShowCalendar(false);
    // Focus back to input
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // Compute column, inputType, isDateColumn, sheetHeight before early return
  // These must run on every render to satisfy Rules of Hooks
  const column = useMemo(
    () => (selectedCell ? ledgerConfig.columns[selectedCell.columnIndex] : null),
    [ledgerConfig, selectedCell]
  );
  const inputType = column?.type === 'number' ? 'number' : 'text';
  const isDateColumn = column?.type === 'date';

  // Sheet height: 50% of viewport on mobile, max 600px on tablet
  const sheetHeight = keyboardHeight > 0
    ? `calc(100vh - ${keyboardHeight}px - 20px)`
    : '50vh';

  const headerTitle = isDrawingMode ? 'Handwriting' : `Edit ${column?.label || 'Cell'}`;
  const toggleButtonClass = isDrawingMode
    ? 'px-3 py-1.5 text-sm rounded-lg transition-colors bg-blue-600 text-white'
    : 'px-3 py-1.5 text-sm rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
  const toggleButtonLabel = isDrawingMode ? 'Drawing' : 'Text';

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

    if (isDrawingMode) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium mb-2">Drawing Mode</p>
          <p className="text-sm">Handwriting canvas will be available in Phase 3</p>
          <button
            type="button"
            onClick={() => onToggleDrawingMode?.()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Switch to Text Input
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <label htmlFor="mobile-cell-input" className="block text-sm font-medium text-gray-700">
          {column?.label || 'Cell Value'}
        </label>
        <input
          ref={inputRef}
          id="mobile-cell-input"
          type={inputType}
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          inputMode={inputType === 'number' ? 'numeric' : 'text'}
          autoComplete="off"
          spellCheck={false}
          className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          placeholder={isDateColumn ? 'YYYY-MM-DD' : 'Enter value...'}
          aria-label={`Edit ${column?.label || 'cell'} value`}
        />

        {/* Quick actions for date column */}
        {isDateColumn && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                // Use local date components to avoid timezone shift (same as useLedgerWorkspace.setCellDate)
                const today = new Date();
                const formatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                setEditValue(formatted);
              }}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setEditValue('')}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderActionButtons = () => {
    if (showCalendar || isDrawingMode) return null;

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
          disabled={editValue.trim() === ''}
          className="flex-1 px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save
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
          // On tablet/desktop, center and limit width
          maxWidth: '100%',
          margin: '0 auto',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div
          className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4 touch-none"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="px-4 mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{headerTitle}</h2>
          <div className="flex items-center gap-2">
            {/* Drawing mode toggle */}
            {onToggleDrawingMode && (
              <button
                type="button"
                onClick={onToggleDrawingMode}
                className={toggleButtonClass}
                aria-pressed={isDrawingMode}
              >
                {toggleButtonLabel}
              </button>
            )}
            {/* Calendar button for date columns */}
            {isDateColumn && !showCalendar && !isDrawingMode && (
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