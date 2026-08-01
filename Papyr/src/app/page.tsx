'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useInkEngine } from '../hooks/useInkEngine';
import { StrokeRenderer } from '../lib/ink-engine/stroke-renderer';
import { RenderLoop } from '../lib/ink-engine/render-loop';
import type { RawPoint, PenSize, Stroke } from '../lib/ink-engine/types';
import { PEN_CONFIGS } from '../lib/ink-engine/types';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    strokes,
    createStroke,
    addStroke,
    undo,
    redo,
    canUndo,
    canRedo,
    setPenSize,
    currentPenSize,
    setPenColor,
    currentColor,
  } = useInkEngine();

  const stateRef = useRef({
    points: [] as RawPoint[],
    isDrawing: false,
    lastRenderedStrokeCount: 0,
    renderedSegmentCount: 0,
  });

  // Ref to store current strokes for render loop (avoids useEffect re-run)
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const renderLoopRef = useRef<RenderLoop | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rendererRef = useRef<StrokeRenderer | null>(null);
  const renderCallbackRef = useRef<(() => void) | null>(null);

  // Setup canvas and render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctxRef.current = ctx;

    // Setup offscreen canvas for completed strokes
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvasRef.current = offscreenCanvas;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return;
    offscreenCtxRef.current = offscreenCtx;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
      offscreenCtx.scale(dpr, dpr);

      ctx.imageSmoothingEnabled = true;
      offscreenCtx.imageSmoothingEnabled = true;

      clearCanvas();
    };

    const clearCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      offscreenCtx.fillStyle = '#ffffff';
      offscreenCtx.fillRect(0, 0, rect.width, rect.height);
    };

    setupCanvas();

    // Initialize render loop
    const renderLoop = new RenderLoop();
    renderLoopRef.current = renderLoop;

    // Create renderer and store in ref
    const renderer = new StrokeRenderer({
      color: currentColor,
      ...PEN_CONFIGS[currentPenSize],
    });
    rendererRef.current = renderer;

    // Define render callback
    const render = () => {
      const state = stateRef.current;
      const currentStrokes = strokesRef.current;
      const currentRenderer = rendererRef.current;
      if (!currentRenderer) return;

      // Only redraw offscreen canvas if completed strokes changed
      if (state.lastRenderedStrokeCount !== currentStrokes.length) {
        offscreenCtx.fillStyle = '#ffffff';
        const rect = canvas.getBoundingClientRect();
        offscreenCtx.fillRect(0, 0, rect.width, rect.height);

        for (const stroke of currentStrokes) {
          offscreenCtx.fillStyle = stroke.color;
          for (const segment of stroke.segments) {
            currentRenderer.drawSegment(offscreenCtx, segment);
          }
        }

        state.lastRenderedStrokeCount = currentStrokes.length;
      }

      // Composite offscreen to main canvas
      ctx.fillStyle = '#ffffff';
      const rect = canvas.getBoundingClientRect();
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.drawImage(offscreenCanvas, 0, 0);

      // Draw current stroke (optimized: only render tail for real-time performance)
      if (state.points.length > 0) {
        const currentSegments = currentRenderer.renderStrokeTail(state.points);
        ctx.fillStyle = currentColor;
        for (const segment of currentSegments) {
          currentRenderer.drawSegment(ctx, segment, 10); // Fewer steps for real-time rendering
        }
      }
    };

    renderCallbackRef.current = render;
    renderLoop.addCallback(render);
    renderLoop.start();

    const handleResize = () => setupCanvas();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
        stateRef.current.lastRenderedStrokeCount = 0;
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
        stateRef.current.lastRenderedStrokeCount = 0;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      if (renderCallbackRef.current) {
        renderLoop.removeCallback(renderCallbackRef.current);
      }
      renderLoop.stop();
    };
  }, [currentPenSize, currentColor, undo, redo]);

  const getCanvasCoords = (e: React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    stateRef.current.isDrawing = true;
    const coords = getCanvasCoords(e);

    stateRef.current.points = [
      {
        x: coords.x,
        y: coords.y,
        t: Date.now(),
        pressure: e.pressure,
        tiltX: e.tiltX,
        tiltY: e.tiltY,
      },
    ];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!stateRef.current.isDrawing) return;

    const coords = getCanvasCoords(e);
    stateRef.current.points.push({
      x: coords.x,
      y: coords.y,
      t: Date.now(),
      pressure: e.pressure,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
    });
  };

  const handlePointerUp = () => {
    if (!stateRef.current.isDrawing || stateRef.current.points.length < 2) {
      stateRef.current.isDrawing = false;
      stateRef.current.points = [];
      return;
    }

    stateRef.current.isDrawing = false;

    const stroke = createStroke(stateRef.current.points);
    addStroke(stroke);
    stateRef.current.points = [];
    stateRef.current.lastRenderedStrokeCount = 0;
  };

  const handlePointerLeave = () => {
    if (stateRef.current.isDrawing) {
      handlePointerUp();
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm px-6 py-4 flex items-center gap-4 border-b border-gray-100 h-16 sm:h-20">
        <Image
          src="/favicon.png"
          alt="Papyr Logo"
          width={56}
          height={56}
          className="rounded-lg w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Papyr</h1>
      </div>

      <div className="mt-16 sm:mt-20 flex-1 flex flex-col overflow-hidden">
        <div
          className="relative flex-1 border-0 overflow-hidden bg-white"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerLeave}
        >
          <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2">
            <div className="flex gap-2 bg-white rounded-lg shadow-md p-2 flex-wrap">
              {(Object.keys(PEN_CONFIGS) as PenSize[]).map(size => (
                <button
                  key={size}
                  onClick={() => setPenSize(size)}
                  className={`px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                    currentPenSize === size ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-2 bg-white rounded-lg shadow-md p-2 items-center">
              <label htmlFor="pen-color" className="sr-only">
                Pen Color
              </label>
              <input
                id="pen-color"
                type="color"
                value={currentColor}
                onChange={e => setPenColor(e.target.value)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded cursor-pointer border-2 border-gray-200 hover:border-gray-400"
                aria-label="Pen color picker"
              />
              <span className="text-xs text-gray-500">{currentColor.toUpperCase()}</span>
            </div>

            <div className="flex gap-2 bg-white rounded-lg shadow-md p-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="px-2 py-1 sm:px-3 text-xs sm:text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                ↶ Undo
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="px-2 py-1 sm:px-3 text-xs sm:text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                ↷ Redo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
