/**
 * Demo/test component for LedgerCanvas
 * This is a standalone demo to verify canvas rendering works correctly
 * Can be used for visual testing and development
 */

'use client';

import { useState } from 'react';
import { LedgerCanvas } from './LedgerCanvas';
import { useInkEngine } from '@/hooks/useInkEngine';
import { DEFAULT_LEDGER_CONFIG } from '@/types/ledger';
import type { RawPoint } from '@/lib/ink-engine/types';

export function LedgerCanvasDemo() {
  const { strokes, createStroke, addStroke, undo, redo, canUndo, canRedo, setPenSize, currentPenSize, setPenColor, currentColor } = useInkEngine();
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
    addStroke(stroke);
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col">
      <div className="bg-white border-b px-4 py-2 flex items-center gap-4">
        <h1 className="text-lg font-semibold">Ledger Canvas Demo</h1>
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
          <label className="text-sm">Pen Size:</label>
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
        <div className="ml-auto text-sm text-gray-600">
          {strokes.length} strokes
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden">
          <LedgerCanvas
            ledgerConfig={DEFAULT_LEDGER_CONFIG}
            strokes={strokes}
            currentStroke={isDrawing ? currentPoints : null}
            currentPenSize={currentPenSize}
            currentColor={currentColor}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
      </div>
    </div>
  );
}
