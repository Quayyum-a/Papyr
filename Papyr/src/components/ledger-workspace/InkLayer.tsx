import { useEffect, useRef } from 'react';
import { StrokeRenderer } from '@/lib/ink-engine/stroke-renderer';
import { PEN_CONFIGS, type Stroke, type RawPoint, type PenSize } from '@/lib/ink-engine/types';
import { LEDGER_CONSTANTS, type LedgerConfig, type CellCoordinates, type LedgerCellData, getCellBounds, parseCellId } from '@/types/ledger';

interface InkLayerProps {
  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  strokes: Stroke[];
  currentStroke: RawPoint[] | null;
  currentPenSize: PenSize;
  currentColor: string;
  selectedCell: CellCoordinates | null;
  ledgerConfig: LedgerConfig;
  // Cell data for determining which strokes to skip (recognized text cells)
  cells?: Record<string, LedgerCellData>;
}

/**
 * Renders ink strokes on the canvas
 * Reuses the existing premium ink engine for rendering
 * Clips strokes to their cell bounds when the cell is currently selected
 */
export function InkLayer({
  ctx,
  width,
  height,
  strokes,
  currentStroke,
  currentPenSize,
  currentColor,
  selectedCell,
  ledgerConfig,
  cells = {},
}: InkLayerProps) {
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastRenderedCountRef = useRef(0);
  const rendererRef = useRef<StrokeRenderer | null>(null);

  // Initialize offscreen canvas for completed strokes
  useEffect(() => {
    if (!ctx) return;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = ctx.canvas.width;
    offscreenCanvas.height = ctx.canvas.height;

    const offscreenCtx = offscreenCanvas.getContext('2d');
    // In test environment (jsdom), offscreen canvas may not have a proper context
    if (!offscreenCtx) {
      console.warn('Offscreen canvas context not available, skipping offscreen rendering');
      return;
    }

    // Scale for DPI
    const dpr = window.devicePixelRatio || 1;
    offscreenCtx.scale(dpr, dpr);
    offscreenCtx.imageSmoothingEnabled = true;
    offscreenCtx.imageSmoothingQuality = 'high';

    offscreenCanvasRef.current = offscreenCanvas;
    offscreenCtxRef.current = offscreenCtx;

    // Initialize renderer
    rendererRef.current = new StrokeRenderer({
      color: currentColor,
      ...PEN_CONFIGS[currentPenSize],
    });
  }, [ctx, currentPenSize, currentColor]);

  // Render strokes
  useEffect(() => {
    if (!ctx || !offscreenCtxRef.current || !rendererRef.current) return;

    const offscreenCtx = offscreenCtxRef.current;
    const renderer = rendererRef.current;

    // Re-render offscreen canvas if completed strokes changed
    if (lastRenderedCountRef.current !== strokes.length) {
      // Clear offscreen canvas
      offscreenCtx.clearRect(0, 0, width, height);

      // Render all completed strokes to offscreen canvas
      // Each stroke is clipped to its own cell's bounds (if it has a cell_id)
      // SKIP strokes for cells that have resolved content (text, number, or failed ink)
      // Only cells with 'empty' content_type (or no cell data) should show raw ink
      for (const stroke of strokes) {
        // Check if this stroke's cell has resolved content
        const cellData = stroke.cell_id ? cells[stroke.cell_id] : null;
        if (cellData && cellData.content_type !== 'empty') {
          // Skip rendering this stroke - the cell will show text/number/indicator instead
          continue;
        }

        offscreenCtx.fillStyle = stroke.color;

        // If stroke has a cell_id, clip to that cell's bounds
        if (stroke.cell_id) {
          const cellCoords = parseCellId(stroke.cell_id);
          if (cellCoords) {
            const bounds = getCellBounds(ledgerConfig, cellCoords.columnIndex, cellCoords.rowIndex);
            if (bounds) {
              offscreenCtx.save();
              offscreenCtx.beginPath();
              offscreenCtx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
              offscreenCtx.clip();

              for (const segment of stroke.segments) {
                renderer.drawSegment(offscreenCtx, segment);
              }

              offscreenCtx.restore();
              continue; // Skip the unclipped render below
            }
          }
        }

        // Free strokes (no cell_id) or strokes with invalid cell_id render unclipped
        for (const segment of stroke.segments) {
          renderer.drawSegment(offscreenCtx, segment);
        }
      }

      lastRenderedCountRef.current = strokes.length;
    }

    // Clear main canvas
    ctx.clearRect(0, 0, width, height);

    // Composite offscreen canvas to main canvas
    if (offscreenCanvasRef.current && offscreenCtxRef.current) {
      try {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      } catch (e) {
        // In test environment, offscreen canvas may not be a valid image source
        // Fall through to render directly to main canvas
        console.warn('Failed to draw offscreen canvas, rendering directly to main canvas');
      }
    }

    // Render current stroke (if drawing) - no clip, write anywhere on the visible canvas
    if (currentStroke && currentStroke.length > 1) {
      const tailSegments = renderer.renderStrokeTail(currentStroke);
      ctx.fillStyle = currentColor;
      for (const segment of tailSegments) {
        renderer.drawSegment(ctx, segment, 10); // Fewer steps for real-time
      }
    }
  }, [ctx, width, height, strokes, currentStroke, currentColor, selectedCell, ledgerConfig, cells]);

  return null; // This component only renders to canvas, no DOM output
}
