import { useEffect, useRef, useState, useCallback } from 'react';
import type { LedgerConfig } from '@/types/ledger';

/**
 * Hook for managing ledger canvas setup and lifecycle
 * Handles canvas initialization, DPI scaling, and resize events
 */
export function useLedgerCanvas(ledgerConfig: LedgerConfig) {
  const paperCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement>(null);

  const paperCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const gridCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const inkCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // Force re-render of layers

  // Memoize setupCanvases to avoid recreating on every render
  const setupCanvases = useCallback(() => {
    const paperCanvas = paperCanvasRef.current;
    const gridCanvas = gridCanvasRef.current;
    const inkCanvas = inkCanvasRef.current;

    if (!paperCanvas || !gridCanvas || !inkCanvas) return false;

    const paperCtx = paperCanvas.getContext('2d');
    const gridCtx = gridCanvas.getContext('2d');
    const inkCtx = inkCanvas.getContext('2d');

    if (!paperCtx || !gridCtx || !inkCtx) {
      console.error('Failed to get canvas contexts');
      return false;
    }

    paperCtxRef.current = paperCtx;
    gridCtxRef.current = gridCtx;
    inkCtxRef.current = inkCtx;

    const dpr = window.devicePixelRatio || 1;
    const rect = paperCanvas.getBoundingClientRect();

    // Set display size (CSS pixels)
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // Skip if container has no size yet
    if (displayWidth === 0 || displayHeight === 0) {
      return false;
    }

    console.log(`Canvas setup successful: ${displayWidth}x${displayHeight}`);

    // Set actual size in memory (scaled by DPI)
    [paperCanvas, gridCanvas, inkCanvas].forEach(canvas => {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    });

    // Scale contexts for DPI
    // Note: Setting canvas.width/height resets the context, so we need to reapply scaling
    [paperCtx, gridCtx, inkCtx].forEach(ctx => {
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    });

    setCanvasSize({ width: displayWidth, height: displayHeight });
    setIsReady(true);
    setRenderKey(prev => prev + 1); // Trigger layer re-render

    console.log('Canvas contexts scaled and ready, DPR:', dpr);
    return true;
  }, []);

  // Setup canvases with ResizeObserver for responsive sizing
  useEffect(() => {
    const paperCanvas = paperCanvasRef.current;
    const gridCanvas = gridCanvasRef.current;
    const inkCanvas = inkCanvasRef.current;

    if (!paperCanvas || !gridCanvas || !inkCanvas) return;

    // Initial setup attempt
    setupCanvases();

    // Set up ResizeObserver to handle container size changes
    // This replaces the retry-loop workaround - we now respond to actual layout changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Only re-setup if the observed element (the canvas container) has a size
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setupCanvases();
          break; // One successful setup is enough
        }
      }
    });

    // Observe the canvas container (parent of the first canvas)
    const container = paperCanvas.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    // Also handle window resize as a fallback
    const handleResize = () => {
      setupCanvases();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [setupCanvases]);

  return {
    paperCanvasRef,
    gridCanvasRef,
    inkCanvasRef,
    paperCtx: paperCtxRef.current,
    gridCtx: gridCtxRef.current,
    inkCtx: inkCtxRef.current,
    canvasSize,
    isReady,
    renderKey, // Used to force layer re-renders
  };
}