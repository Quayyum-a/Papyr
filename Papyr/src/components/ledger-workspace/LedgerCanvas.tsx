'use client';

import { useLedgerCanvas } from './useLedgerCanvas';
import { PaperLayer } from './PaperLayer';
import { GridLayer } from './GridLayer';
import { InkLayer } from './InkLayer';
import type { LedgerConfig, CellCoordinates } from '@/types/ledger';
import type { Stroke, RawPoint, PenSize } from '@/lib/ink-engine/types';

interface LedgerCanvasProps {
  ledgerConfig: LedgerConfig;
  strokes: Stroke[];
  currentStroke: RawPoint[] | null;
  currentPenSize: PenSize;
  currentColor: string;
  selectedCell: CellCoordinates | null;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave?: (e: React.PointerEvent<HTMLDivElement>) => void;
  className?: string;
}

/**
 * Main ledger canvas component
 * Manages three stacked canvas layers: paper, grid, and ink
 * 
 * Architecture:
 * - Z-index 1: Paper background with texture
 * - Z-index 1: Grid lines (rows and columns)
 * - Z-index 2: Ink strokes
 * - Z-index 3: HTML overlay (rendered separately)
 */
export function LedgerCanvas({
  ledgerConfig,
  strokes,
  currentStroke,
  currentPenSize,
  currentColor,
  selectedCell,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  className = '',
}: LedgerCanvasProps) {
  const {
    paperCanvasRef,
    gridCanvasRef,
    inkCanvasRef,
    paperCtx,
    gridCtx,
    inkCtx,
    canvasSize,
    isReady,
    renderKey,
  } = useLedgerCanvas(ledgerConfig);

  return (
    <div
      className={`relative w-full h-full ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
      style={{ touchAction: 'none' }}
    >
      {/* Loading skeleton while canvas initializes */}
      {!isReady && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-50"
          role="status"
          aria-label="Loading ledger canvas"
        >
          <div className="animate-pulse flex flex-col items-center gap-3 text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-sm">Preparing ledger…</span>
          </div>
        </div>
      )}

      {/* Paper layer (z-index: 1) */}
      <canvas
        ref={paperCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      />

      {/* Grid layer (z-index: 1, above paper) */}
      <canvas
        ref={gridCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      />

      {/* Ink layer (z-index: 2) */}
      <canvas
        ref={inkCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }}
        aria-hidden="true"
      />

      {/* Render layers when ready */}
      {isReady && (
        <>
          <PaperLayer
            key={`paper-${renderKey}`}
            ctx={paperCtx}
            width={canvasSize.width}
            height={canvasSize.height}
          />
          <GridLayer
            key={`grid-${renderKey}`}
            ctx={gridCtx}
            width={canvasSize.width}
            height={canvasSize.height}
            ledgerConfig={ledgerConfig}
          />
          <InkLayer
            key={`ink-${renderKey}`}
            ctx={inkCtx}
            width={canvasSize.width}
            height={canvasSize.height}
            strokes={strokes}
            currentStroke={currentStroke}
            currentPenSize={currentPenSize}
            currentColor={currentColor}
            selectedCell={selectedCell}
            ledgerConfig={ledgerConfig}
          />
        </>
      )}
    </div>
  );
}
