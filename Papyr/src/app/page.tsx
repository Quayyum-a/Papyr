'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useInkEngine } from '../hooks/useInkEngine';
import { StrokeRenderer } from '../lib/ink-engine/stroke-renderer';
import type { RawPoint, PenSize } from '../lib/ink-engine/types';
import { PEN_CONFIGS } from '../lib/ink-engine/types';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { strokes, createStroke, addStroke, undo, redo, canUndo, canRedo, setPenSize, currentPenSize } =
    useInkEngine();

  const [points, setPoints] = useState<RawPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    };

    setupCanvas();
    redrawCanvas();

    const handleResize = () => setupCanvas();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, points]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = '#000000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const renderer = new StrokeRenderer({
      color: '#000000',
      ...PEN_CONFIGS[currentPenSize],
    });

    for (const stroke of strokes) {
      for (const segment of stroke.segments) {
        renderer.drawSegment(ctx, segment);
      }
    }

    if (points.length > 0) {
      const currentStroke = createStroke(points);
      for (const segment of currentStroke.segments) {
        renderer.drawSegment(ctx, segment);
      }
    }
  };

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
    setIsDrawing(true);
    startTimeRef.current = Date.now();
    const coords = getCanvasCoords(e);

    setPoints([
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

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;

    const coords = getCanvasCoords(e);
    setPoints(prev => [
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
    if (!isDrawing || points.length < 2) {
      setIsDrawing(false);
      setPoints([]);
      return;
    }

    setIsDrawing(false);

    const stroke = createStroke(points);
    addStroke(stroke);
    setPoints([]);
  };

  const handlePointerLeave = () => {
    if (isDrawing) {
      handlePointerUp();
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm px-6 py-4 flex items-center gap-4 border-b border-gray-100 h-16 sm:h-20">
        <Image src="/favicon.png" alt="Papyr Logo" width={56} height={56} className="rounded-lg w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Papyr</h1>
      </div>

      <div className="mt-16 sm:mt-20 flex-1 flex flex-col overflow-hidden">
        <div
          className="relative flex-1 border-0 overflow-hidden bg-white touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerLeave}
        >
          <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2">
            <div className="flex gap-2 bg-white rounded-lg shadow-md p-2">
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
