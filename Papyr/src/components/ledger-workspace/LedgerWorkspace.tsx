'use client';

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

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 py-2 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Pen:</label>
          <select
            value={currentPenSize}
            onChange={e => setPenSize(e.target.value as any)}
            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="extra-fine">Extra Fine</option>
            <option value="fine">Fine</option>
            <option value="medium">Medium</option>
            <option value="bold">Bold</option>
            <option value="marker">Marker</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Color:</label>
          <input
            type="color"
            value={currentColor}
            onChange={e => setPenColor(e.target.value)}
            className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
            aria-label="Pen color"
          />
        </div>

        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span>{strokes.length} strokes</span>
          <span>{ledgerConfig.columns.length} columns</span>
          {selectedCell && (
            <span className="text-blue-600 font-medium">
              Cell: {selectedCell.columnIndex}, {selectedCell.rowIndex}
            </span>
          )}
          {isSaving && <span className="text-yellow-600">Saving...</span>}
        </div>
      </div>

      {/* Ledger Workspace */}
      <div className="relative w-full h-full">
        <div className="absolute inset-0 border border-gray-300 rounded-lg overflow-hidden bg-white" style={{ top: '44px' }}>
          {/* Canvas layers */}
          <LedgerCanvas
            ledgerConfig={ledgerConfig}
            strokes={strokes}
            currentStroke={currentPoints}
            currentPenSize={currentPenSize}
            currentColor={currentColor}
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
    </div>
  );
}