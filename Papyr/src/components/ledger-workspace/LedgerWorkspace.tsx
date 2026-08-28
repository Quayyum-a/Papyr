'use client';

import { useEffect, useCallback, useRef } from 'react';
import { LedgerCanvas } from '@/components/ledger-workspace/LedgerCanvas';
import { ColumnHeaders } from '@/components/ledger-workspace/ColumnHeaders';
import { CellHighlights } from '@/components/ledger-workspace/CellHighlights';
import { CellContent } from '@/components/ledger-workspace/CellContent';
import { CalendarPicker } from '@/components/ledger-workspace/CalendarPicker';
import { LedgerToolbar } from '@/components/ledger-workspace/LedgerToolbar';
import { EditableCell } from '@/components/ledger-workspace/EditableCell';
import { useLedgerWorkspace } from '@/hooks/useLedgerWorkspace';
import type { LedgerPageContent, CellCoordinates, LedgerCellData } from '@/types/ledger';
import { getLedgerContentDimensions } from '@/types/ledger';
import { supabase } from '@/lib/supabase/client';

interface LedgerWorkspaceProps {
  bookId: string;
  pageId: string | null;
  initialContent?: LedgerPageContent;
  className?: string;
}

/**
 * Complete ledger workspace component
 * Combines canvas layers (paper, grid, ink) with overlay (headers, cell selection)
 * Handles all persistence to Supabase
 * Full keyboard navigation and accessibility support
 */
export function LedgerWorkspace({
  bookId,
  pageId,
  initialContent,
  className = '',
}: LedgerWorkspaceProps) {
  // Ref for scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    // Ink engine
    strokes,
    currentPoints,
    currentPenSize,
    currentColor,
    setPenSize,
    setPenColor,
    undo,
    redo,
    canUndo,
    canRedo,

    // Cell selection
    selectedCell,
    selectedCellId,
    selectCell,
    clearSelection,

    // Ledger config
    ledgerConfig,
    addColumn,
    editColumn,
    removeColumn,
    setLedgerConfig,

    // Drawing state
    isDrawing,
    isSaving,

    // Recognition state
    recognizingCells,
    inkCanvasRef,

    // Cell data
    cells,

    // Calendar picker
    calendarPickerCell,
    openCalendarPicker,
    closeCalendarPicker,
    setCellDate,

    // Pointer handlers
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
  setCellValue,
  } = useLedgerWorkspace({
    bookId,
    pageId,
    initialContent,
    onSave: async (content) => {
      if (!pageId) return;

      const { error } = await supabase
        .from('pages')
        .update({ content })
        .eq('id', pageId);

      if (error) throw error;
    },
  });

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle shortcuts when editing an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Undo: Ctrl+Z (or Cmd+Z on Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (canUndo) undo();
      return;
    }

    // Redo: Ctrl+Shift+Z (or Cmd+Shift+Z on Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      if (canRedo) redo();
      return;
    }

    // Alternative Redo: Ctrl+Y (or Cmd+Y on Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      if (canRedo) redo();
      return;
    }

    // Escape: Clear cell selection
    if (e.key === 'Escape' && selectedCell) {
      clearSelection();
      return;
    }

    // Enter: Start editing focused column header (handled by ColumnHeaders)
    // Arrow keys: Cell navigation (handled by CellHighlights)
  }, [canUndo, canRedo, undo, redo, selectedCell, clearSelection]);

  // Compute ledger content dimensions from config
  const contentDimensions = getLedgerContentDimensions(ledgerConfig);

  // Register keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`relative w-full h-full ${className}`} role="application" aria-label="Ledger workspace">
      {/* Responsive Toolbar */}
      <LedgerToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        currentPenSize={currentPenSize}
        currentColor={currentColor}
        onPenSizeChange={setPenSize}
        onColorChange={setPenColor}
        strokeCount={strokes.length}
        columnCount={ledgerConfig.columns.length}
        selectedCell={selectedCell}
        isSaving={isSaving}
      />

      {/* Scrollable Ledger Workspace */}
      <div
        ref={scrollContainerRef}
        className="relative w-full h-full overflow-auto md:pr-20"
        style={{
          // On mobile, account for header height by using viewport units
          // The parent (BookLedgerPage) has header (h-14 = 56px) + flex-1 for this container
          // So this container should be 100% of the flex-1 space
        }}
      >
        {/*
          Content wrapper with min-width 100% and width max-content to ensure
          it fills the viewport horizontally while allowing horizontal scroll
          when ledger content is wider than viewport. Height is fixed to ledger
          content height to prevent vertical stretching.
          On mobile, we cap the height to the available viewport to prevent overflow.
        */}
        <div
          className="relative border border-gray-300 rounded-lg bg-white"
          role="region"
          aria-label="Ledger grid"
          style={{
            minWidth: '100%',
            width: 'max-content',
            height: `${contentDimensions.height}px`,
            // On mobile, allow the content to be scrolled if taller than viewport
            // The scroll container handles the overflow
          }}
        >
          {/* Canvas layers */}
          <LedgerCanvas
            ledgerConfig={ledgerConfig}
            strokes={strokes}
            currentStroke={currentPoints}
            currentPenSize={currentPenSize}
            currentColor={currentColor}
            selectedCell={selectedCell}
            inkCanvasRef={inkCanvasRef}
            recognizingCells={recognizingCells}
            scrollContainerRef={scrollContainerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            cells={cells}
          />

          {/* Cell content overlay - recognized text and failed recognition indicators */}
          <CellContent
            ledgerConfig={ledgerConfig}
            cells={cells}
            selectedCell={selectedCell}
            recognizingCells={recognizingCells}
          />

          {/* Overlay layers */}
          <ColumnHeaders
            columns={ledgerConfig.columns}
            onColumnEdit={editColumn}
            onColumnAdd={addColumn}
            onColumnRemove={removeColumn}
          />

          <CellHighlights
            ledgerConfig={ledgerConfig}
            selectedCell={selectedCell}
            recognizingCells={recognizingCells}
            onCellSelect={(coords) => {
              if (coords) {
                // Check if this is a date column and open calendar picker
                const column = ledgerConfig.columns[coords.columnIndex];
                if (column?.type === 'date') {
                  openCalendarPicker(coords.columnIndex, coords.rowIndex);
                } else {
                  selectCell(coords);
                }
              } else {
                selectCell(null);
              }
            }}
            onCellDoubleClick={(columnIndex, rowIndex) => {
              // Double-click on any cell (including date columns) starts text editing
              const coords: CellCoordinates = { columnIndex, rowIndex };
              if (selectedCell && selectedCell.columnIndex === columnIndex && selectedCell.rowIndex === rowIndex) {
                // Cell is already selected, editing will be triggered by EditableCell's double-click handler
              }
            }}
          />

          {/* Calendar Picker for date cells */}
          {calendarPickerCell && (
            <CalendarPicker
              ledgerConfig={ledgerConfig}
              selectedCell={{
                columnIndex: calendarPickerCell.columnIndex,
                rowIndex: calendarPickerCell.rowIndex,
              }}
              cells={cells}
              onDateSelect={setCellDate}
              onClose={closeCalendarPicker}
              scrollContainerRef={scrollContainerRef}
            />
          )}

          {/* Inline text editor for cell editing (double-click or Enter/F2) */}
          <EditableCell
            ledgerConfig={ledgerConfig}
            cells={cells}
            selectedCell={selectedCell}
            onCellValueChange={setCellValue}
            scrollContainerRef={scrollContainerRef}
            isVisible={!calendarPickerCell}
          />
        </div>
      </div>

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isSaving && 'Saving changes'}
        {selectedCell && `Selected cell: ${ledgerConfig.columns[selectedCell.columnIndex]?.label || `Column ${selectedCell.columnIndex + 1}`}, Row ${selectedCell.rowIndex + 1}`}
      </div>
    </div>
  );
}