'use client';

import { useEffect, useCallback } from 'react';
import { LedgerCanvas } from '@/components/ledger-workspace/LedgerCanvas';
import { ColumnHeaders } from '@/components/ledger-workspace/ColumnHeaders';
import { CellHighlights } from '@/components/ledger-workspace/CellHighlights';
import { useLedgerWorkspace } from '@/hooks/useLedgerWorkspace';
import type { LedgerPageContent } from '@/types/ledger';
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

  // Register keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`relative w-full h-full ${className}`} role="application" aria-label="Ledger workspace">
      {/* Toolbar - Vertical on right side */}
      <div
        className="absolute top-0 right-0 h-full z-10 bg-white/95 backdrop-blur-sm border-l border-gray-200 px-2 py-3 flex flex-col items-center gap-4"
        role="toolbar"
        aria-label="Ledger toolbar"
      >
        <div className="flex flex-col gap-1" role="group" aria-label="History">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Undo (Ctrl+Z)"
            aria-disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Redo (Ctrl+Shift+Z)"
            aria-disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        <div className="h-px w-full bg-gray-300 my-2" aria-hidden="true" />

        <div className="flex flex-col items-center gap-2" role="group" aria-label="Pen settings">
          <label htmlFor="pen-size" className="text-xs text-gray-500">Pen:</label>
          <select
            id="pen-size"
            value={currentPenSize}
            onChange={e => setPenSize(e.target.value as any)}
            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[44px] min-h-[44px] w-full text-center"
            aria-label="Pen size"
          >
            <option value="extra-fine">Extra Fine</option>
            <option value="fine">Fine</option>
            <option value="medium">Medium</option>
            <option value="bold">Bold</option>
            <option value="marker">Marker</option>
          </select>
        </div>

        <div className="h-px w-full bg-gray-300 my-2" aria-hidden="true" />

        <div className="flex flex-col items-center gap-2" role="group" aria-label="Color picker">
          <label htmlFor="pen-color" className="text-xs text-gray-500">Color:</label>
          <input
            id="pen-color"
            type="color"
            value={currentColor}
            onChange={e => setPenColor(e.target.value)}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer min-w-[44px] min-h-[44px]"
            aria-label="Pen color"
            title="Pen color"
          />
        </div>

        <div className="h-px w-full bg-gray-300 my-2" aria-hidden="true" />

        <div className="flex flex-col items-center gap-1 text-xs text-gray-500 mt-auto" aria-live="polite" aria-atomic="true">
          <span>{strokes.length} strokes</span>
          <span>{ledgerConfig.columns.length} columns</span>
          {selectedCell && (
            <span className="text-blue-600 font-medium text-center" aria-label={`Selected cell: column ${selectedCell.columnIndex + 1}, row ${selectedCell.rowIndex + 1}`}>
              Cell: {selectedCell.columnIndex + 1}, {selectedCell.rowIndex + 1}
            </span>
          )}
          {isSaving && <span className="text-yellow-600" aria-label="Saving changes">Saving…</span>}
        </div>
      </div>

      {/* Ledger Workspace */}
      <div className="relative w-full h-full">
        <div
          className="absolute inset-0 border border-gray-300 rounded-lg overflow-hidden bg-white"
          role="region"
          aria-label="Ledger grid"
        >
          {/* Canvas layers */}
          <LedgerCanvas
            ledgerConfig={ledgerConfig}
            strokes={strokes}
            currentStroke={currentPoints}
            currentPenSize={currentPenSize}
            currentColor={currentColor}
            selectedCell={selectedCell}
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