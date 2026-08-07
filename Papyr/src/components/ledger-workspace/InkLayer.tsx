import { useEffect, useRef } from 'react';
import { StrokeRenderer } from '@/lib/ink-engine/stroke-renderer';
import { PEN_CONFIGS, type Stroke, type RawPoint, type PenSize } from '@/lib/ink-engine/types';

interface InkLayerProps {
  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  strokes: Stroke[];
  currentStroke: RawPoint[] | null;
  currentPenSize: PenSize;
  currentColor: string;
}

/**
 * Renders ink strokes on the canvas
 * Reuses the existing premium ink engine for rendering
 */
export function InkLayer({
  ctx,
  width,
  height,
  strokes,
  currentStroke,
  currentPenSize,
  currentColor,
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
    if (!offscreenCtx) return;

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
    if (offscreenCanvasRef.current) {
      ctx.drawImage(offscreenCanvasRef.current, 0, 0);
    }

    // Render current stroke (if drawing)
    if (currentStroke && currentStroke.length > 1) {
      const tailSegments = renderer.renderStrokeTail(currentStroke);
      ctx.fillStyle = currentColor;
      for (const segment of tailSegments) {
        renderer.drawSegment(ctx, segment, 10); // Fewer steps for real-time
      }
    }
  }, [ctx, width, height, strokes, currentStroke, currentColor]);

  return null; // This component only renders to canvas, no DOM output
}
