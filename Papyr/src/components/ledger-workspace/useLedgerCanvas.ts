import { useEffect, useRef, useState } from 'react';
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

  // Setup canvases with proper DPI scaling
  useEffect(() => {
    const paperCanvas = paperCanvasRef.current;
    const gridCanvas = gridCanvasRef.current;
    const inkCanvas = inkCanvasRef.current;

    if (!paperCanvas || !gridCanvas || !inkCanvas) return;

    const paperCtx = paperCanvas.getContext('2d');
    const gridCtx = gridCanvas.getContext('2d');
    const inkCtx = inkCanvas.getContext('2d');

    if (!paperCtx || !gridCtx || !inkCtx) {
      console.error('Failed to get canvas contexts');
      return;
    }

    paperCtxRef.current = paperCtx;
    gridCtxRef.current = gridCtx;
    inkCtxRef.current = inkCtx;

    const setupCanvases = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = paperCanvas.getBoundingClientRect();

      // Set display size (CSS pixels)
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      // Set actual size in memory (scaled by DPI)
      [paperCanvas, gridCanvas, inkCanvas].forEach(canvas => {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
      });

      // Scale contexts for DPI
      [paperCtx, gridCtx, inkCtx].forEach(ctx => {
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      });

      setCanvasSize({ width: displayWidth, height: displayHeight });
      setIsReady(true);
    };

    setupCanvases();

    // Handle window resize
    const handleResize = () => {
      setupCanvases();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    paperCanvasRef,
    gridCanvasRef,
    inkCanvasRef,
    paperCtx: paperCtxRef.current,
    gridCtx: gridCtxRef.current,
    inkCtx: inkCtxRef.current,
    canvasSize,
    isReady,
  };
}
