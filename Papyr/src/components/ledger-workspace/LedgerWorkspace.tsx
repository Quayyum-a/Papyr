'use client';

import { useEffect, useCallback, useRef } from 'react';
import { LedgerCanvas } from '@/components/ledger-workspace/LedgerCanvas';
import { ColumnHeaders } from '@/components/ledger-workspace/ColumnHeaders';
import { CellHighlights } from '@/components/ledger-workspace/CellHighlights';
import { LedgerToolbar } from '@/components/ledger-workspace/LedgerToolbar';
import { useLedgerWorkspace } from '@/hooks/useLedgerWorkspace';
import type { LedgerPageContent } from '@/types/ledger';
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

    // Pointer handlers
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
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
        className="relative w-full min-h-full overflow-auto md:pr-20"
      >
        {/*
          Content wrapper with min-width 100% and width max-content to ensure
          it fills the viewport horizontally while allowing horizontal scroll
          when ledger content is wider than viewport. Height is fixed to ledger
          content height to prevent vertical stretching.
        */}
        <div
          className="relative border border-gray-300 rounded-lg bg-white"
          role="region"
          aria-label="Ledger grid"
          style={{
            minWidth: '100%',
            width: 'max-content',
            height: `${contentDimensions.height}px`,
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
            onCellSelect={selectCell}
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