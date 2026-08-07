'use client';

import { useLedgerCanvas } from './useLedgerCanvas';
import { PaperLayer } from './PaperLayer';
import { GridLayer } from './GridLayer';
import { InkLayer } from './InkLayer';
import type { LedgerConfig } from '@/types/ledger';
import type { Stroke, RawPoint, PenSize } from '@/lib/ink-engine/types';

interface LedgerCanvasProps {
  ledgerConfig: LedgerConfig;
  strokes: Stroke[];
  currentStroke: RawPoint[] | null;
  currentPenSize: PenSize;
  currentColor: string;
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
  } = useLedgerCanvas(ledgerConfig);

  return (
    <div
      className={`relative w-full h-full ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
      style={{ touchAction: 'none' }} // Prevent default touch behaviors
    >
      {/* Paper layer (z-index: 1) */}
      <canvas
        ref={paperCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Grid layer (z-index: 1, above paper) */}
      <canvas
        ref={gridCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Ink layer (z-index: 2) */}
      <canvas
        ref={inkCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }}
      />

      {/* Render layers when ready */}
      {isReady && (
        <>
          <PaperLayer
            ctx={paperCtx}
            width={canvasSize.width}
            height={canvasSize.height}
          />
          <GridLayer
            ctx={gridCtx}
            width={canvasSize.width}
            height={canvasSize.height}
            ledgerConfig={ledgerConfig}
          />
          <InkLayer
            ctx={inkCtx}
            width={canvasSize.width}
            height={canvasSize.height}
            strokes={strokes}
            currentStroke={currentStroke}
            currentPenSize={currentPenSize}
            currentColor={currentColor}
          />
        </>
      )}
    </div>
  );
}
