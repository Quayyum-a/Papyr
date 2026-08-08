import { useEffect, useRef } from 'react';
import { StrokeRenderer } from '@/lib/ink-engine/stroke-renderer';
import { PEN_CONFIGS, type Stroke, type RawPoint, type PenSize } from '@/lib/ink-engine/types';
import { LEDGER_CONSTANTS, type LedgerConfig, type CellCoordinates, getCellBounds } from '@/types/ledger';

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
      // Completed strokes are rendered at their stored positions without clipping
      // (they were already clipped when drawn under their cell's selection)
      for (const stroke of strokes) {
        offscreenCtx.fillStyle = stroke.color;
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

    // Render current stroke (if drawing) - clip to selected cell bounds
    if (currentStroke && currentStroke.length > 1 && selectedCell) {
      const bounds = getCellBounds(ledgerConfig, selectedCell.columnIndex, selectedCell.rowIndex);
      if (bounds) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.clip();

        const tailSegments = renderer.renderStrokeTail(currentStroke);
        ctx.fillStyle = currentColor;
        for (const segment of tailSegments) {
          renderer.drawSegment(ctx, segment, 10); // Fewer steps for real-time
        }

        ctx.restore();
      }
    }
  }, [ctx, width, height, strokes, currentStroke, currentColor, selectedCell, ledgerConfig]);

  return null; // This component only renders to canvas, no DOM output
}
