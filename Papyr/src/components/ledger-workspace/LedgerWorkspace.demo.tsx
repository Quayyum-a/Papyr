/**
 * Complete demo for LedgerWorkspace with all features
 * Shows canvas + overlay integration
 */

'use client';

import { useState } from 'react';
import { LedgerCanvas } from './LedgerCanvas';
import { ColumnHeaders } from './ColumnHeaders';
import { CellHighlights } from './CellHighlights';
import { useInkEngine } from '@/hooks/useInkEngine';
import { useCellSelection } from './useCellSelection';
import { useLedgerConfig } from './useLedgerConfig';
import { DEFAULT_LEDGER_CONFIG } from '@/types/ledger';
import type { RawPoint } from '@/lib/ink-engine/types';

export function LedgerWorkspaceDemo() {
  const { strokes, createStroke, addStroke, undo, redo, canUndo, canRedo, setPenSize, currentPenSize, setPenColor, currentColor } = useInkEngine();
  const { selectedCell, selectedCellId, selectCell } = useCellSelection();

  // Add IDs to default columns for LedgerConfig compatibility
  const ledgerConfigWithIds = {
    ...DEFAULT_LEDGER_CONFIG,
    columns: DEFAULT_LEDGER_CONFIG.columns.map((col, idx) => ({
      ...col,
      id: `default-col-${idx}`,
    })),
  };

  const { ledgerConfig, addColumn, editColumn, removeColumn } = useLedgerConfig(ledgerConfigWithIds);
  
  const [currentPoints, setCurrentPoints] = useState<RawPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCanvasCoords = (e: React.PointerEvent, canvas: HTMLElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e, e.currentTarget);
    setCurrentPoints([
      {
        x: coords.x,
        y: coords.y,
        t: Date.now(),
        pressure: e.pressure,
        tiltX: e.tiltX,
        tiltY: e.tiltY,
      },
    ]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e, e.currentTarget);
    setCurrentPoints(prev => [
      ...prev,
      {
        x: coords.x,
        y: coords.y,
        t: Date.now(),
        pressure: e.pressure,
        tiltX: e.tiltX,
        tiltY: e.tiltY,
      },
    ]);
  };

  const handlePointerUp = () => {
    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }

    const stroke = createStroke(currentPoints);
    // Add cell binding if a cell is selected
    if (selectedCellId) {
      stroke.cell_id = selectedCellId;
    }
    addStroke(stroke);
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-4 flex-wrap">
        <h1 className="text-lg font-semibold">Ledger Workspace Demo</h1>
        
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Redo
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm">Pen:</label>
          <select
            value={currentPenSize}
            onChange={e => setPenSize(e.target.value as any)}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value="extra-fine">Extra Fine</option>
            <option value="fine">Fine</option>
            <option value="medium">Medium</option>
            <option value="bold">Bold</option>
            <option value="marker">Marker</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm">Color:</label>
          <input
            type="color"
            value={currentColor}
            onChange={e => setPenColor(e.target.value)}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>

        <div className="ml-auto flex gap-4 text-sm text-gray-600">
          <span>{strokes.length} strokes</span>
          <span>{ledgerConfig.columns.length} columns</span>
          {selectedCell && (
            <span className="text-blue-600">
              Selected: Col {selectedCell.columnIndex}, Row {selectedCell.rowIndex}
            </span>
          )}
        </div>
      </div>

      {/* Ledger Workspace */}
      <div className="flex-1 p-4">
        <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden relative bg-white">
          {/* Canvas layers */}
          <LedgerCanvas
            ledgerConfig={ledgerConfig}
            strokes={strokes}
            currentStroke={isDrawing ? currentPoints : null}
            currentPenSize={currentPenSize}
            currentColor={currentColor}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
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

      {/* Instructions */}
      <div className="bg-white border-t px-4 py-2 text-sm text-gray-600">
        <strong>Instructions:</strong> Tap a cell to select it (yellow highlight), then draw to bind ink to that cell. 
        Tap-and-hold column headers to edit names. Hover over headers to remove columns. 
        Click &quot;+&quot; to add columns.
      </div>
    </div>
  );
}
