'use client';

import { useState } from 'react';
import { Undo2, Redo2, Pen, Palette, ChevronLeft } from 'lucide-react';
import type { PenSize } from '@/lib/ink-engine/types';
import type { CellCoordinates } from '@/types/ledger';

interface LedgerToolbarProps {
  // History
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  
  // Pen settings
  currentPenSize: PenSize;
  currentColor: string;
  onPenSizeChange: (size: PenSize) => void;
  onColorChange: (color: string) => void;
  
  // Status
  strokeCount: number;
  columnCount: number;
  selectedCell: CellCoordinates | null;
  isSaving: boolean;
}

/**
 * Responsive toolbar for ledger workspace
 * Desktop: Vertical sidebar on right (80px width)
 * Mobile: Compact floating expandable button
 */
export function LedgerToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  currentPenSize,
  currentColor,
  onPenSizeChange,
  onColorChange,
  strokeCount,
  columnCount,
  selectedCell,
  isSaving,
}: LedgerToolbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Toolbar - Vertical sidebar (hidden on mobile) */}
      <div
        className="hidden md:flex absolute top-0 right-0 h-full z-10 bg-white/90 backdrop-blur-sm shadow-lg px-3 py-4 flex-col items-center gap-4"
        role="toolbar"
        aria-label="Ledger toolbar"
        style={{ width: '80px' }}
      >
        <div className="flex flex-col gap-2" role="group" aria-label="History">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full aspect-square flex items-center justify-center"
            aria-label="Undo (Ctrl+Z)"
            title="Undo"
          >
            <Undo2 className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full aspect-square flex items-center justify-center"
            aria-label="Redo (Ctrl+Shift+Z)"
            title="Redo"
          >
            <Redo2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="h-px w-full bg-gray-300" aria-hidden="true" />

        <div className="flex flex-col items-center gap-2 w-full" role="group" aria-label="Pen settings">
          <label htmlFor="pen-size-desktop" className="text-xs text-gray-500 font-medium">Pen</label>
          <select
            id="pen-size-desktop"
            value={currentPenSize}
            onChange={e => onPenSizeChange(e.target.value as PenSize)}
            className="px-1 py-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-center"
            aria-label="Pen size"
          >
            <option value="extra-fine">XFine</option>
            <option value="fine">Fine</option>
            <option value="medium">Med</option>
            <option value="bold">Bold</option>
            <option value="marker">Mark</option>
          </select>
        </div>

        <div className="h-px w-full bg-gray-300" aria-hidden="true" />

        <div className="flex flex-col items-center gap-2 w-full" role="group" aria-label="Color picker">
          <label htmlFor="pen-color-desktop" className="text-xs text-gray-500 font-medium">Color</label>
          <input
            id="pen-color-desktop"
            type="color"
            value={currentColor}
            onChange={e => onColorChange(e.target.value)}
            className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
            aria-label="Pen color"
            title="Pen color"
          />
        </div>

        <div className="h-px w-full bg-gray-300" aria-hidden="true" />

        <div className="flex flex-col items-center gap-1 text-xs text-gray-500 mt-auto text-center" aria-live="polite">
          <span className="font-medium">{strokeCount}</span>
          <span className="text-[10px] leading-tight">strokes</span>
          <span className="font-medium mt-1">{columnCount}</span>
          <span className="text-[10px] leading-tight">columns</span>
          {selectedCell && (
            <span className="text-blue-600 font-medium mt-2" aria-label={`Selected cell: column ${selectedCell.columnIndex + 1}, row ${selectedCell.rowIndex + 1}`}>
              {selectedCell.columnIndex + 1},{selectedCell.rowIndex + 1}
            </span>
          )}
          {isSaving && <span className="text-yellow-600 mt-2">Saving…</span>}
        </div>
      </div>

      {/* Mobile Toolbar - Compact floating button (visible only on mobile) */}
      <div className="md:hidden absolute bottom-4 right-4 z-10">
        {/* Floating action button */}
        {!isMobileMenuOpen ? (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-800 shadow-lg flex items-center justify-center transition-all active:scale-95"
            aria-label="Open toolbar"
          >
            <Pen className="w-6 h-6 text-white" />
          </button>
        ) : (
          /* Expanded mobile menu */
          <div className="bg-white rounded-2xl shadow-2xl p-4 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Tools</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close toolbar"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* History controls */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                aria-label="Undo"
              >
                <Undo2 className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">Undo</span>
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                aria-label="Redo"
              >
                <Redo2 className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">Redo</span>
              </button>
            </div>

            {/* Pen size */}
            <div className="mb-4">
              <label htmlFor="pen-size-mobile" className="block text-xs font-medium text-gray-600 mb-2">
                Pen Size
              </label>
              <select
                id="pen-size-mobile"
                value={currentPenSize}
                onChange={e => onPenSizeChange(e.target.value as PenSize)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="extra-fine">Extra Fine</option>
                <option value="fine">Fine</option>
                <option value="medium">Medium</option>
                <option value="bold">Bold</option>
                <option value="marker">Marker</option>
              </select>
            </div>

            {/* Color picker */}
            <div className="mb-4">
              <label htmlFor="pen-color-mobile" className="block text-xs font-medium text-gray-600 mb-2">
                Pen Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="pen-color-mobile"
                  type="color"
                  value={currentColor}
                  onChange={e => onColorChange(e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-600 font-mono">{currentColor}</span>
              </div>
            </div>

            {/* Status info */}
            <div className="pt-3 border-t border-gray-200 text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Strokes:</span>
                <span className="font-medium text-gray-900">{strokeCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Columns:</span>
                <span className="font-medium text-gray-900">{columnCount}</span>
              </div>
              {selectedCell && (
                <div className="flex justify-between">
                  <span>Selected:</span>
                  <span className="font-medium text-blue-600">
                    Col {selectedCell.columnIndex + 1}, Row {selectedCell.rowIndex + 1}
                  </span>
                </div>
              )}
              {isSaving && (
                <div className="text-yellow-600 font-medium">Saving...</div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
