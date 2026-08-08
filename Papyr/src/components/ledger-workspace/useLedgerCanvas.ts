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
  const [renderKey, setRenderKey] = useState(0); // Force re-render of layers

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

      // Skip if container has no size yet (prevents blank canvas)
      if (displayWidth === 0 || displayHeight === 0) {
        console.warn('Canvas container has zero dimensions, will retry...');
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
    };

    // Try to setup canvases, retry if container has no dimensions yet
    let retryCount = 0;
    const maxRetries = 10;
    
    const trySetup = () => {
      const success = setupCanvases();
      
      // If setup failed and we haven't exceeded retries, try again next frame
      if (!success && retryCount < maxRetries) {
        retryCount++;
        requestAnimationFrame(trySetup);
      }
    };
    
    trySetup();

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
    renderKey, // Used to force layer re-renders
  };
}
