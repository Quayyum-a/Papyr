'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getStroke } from 'perfect-freehand';
import { useStrokeHistory } from '../hooks/useStrokeHistory';
import { v4 as uuidv4 } from 'uuid';
import { Stroke, Point } from '../types/stroke';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const { strokes, addStroke, undo, redo, canUndo, canRedo } = useStrokeHistory();
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, points]);

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

  const drawStroke = (ctx: CanvasRenderingContext2D, points: Point[], width: number) => {
    if (points.length < 2) return;
    const smoothed = points.length > 2 ? getStroke(points as any) : points.map(p => [p.x, p.y]);
    ctx.beginPath();
    ctx.moveTo(smoothed[0][0], smoothed[0][1]);
    for (let i = 1; i < smoothed.length; i++) {
      const point = smoothed[i];
      ctx.lineTo(point[0], point[1]);
    }
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.95;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw all strokes from history
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.width);
    });
    // Draw current stroke if exists
    if (points.length > 0) {
      const avgPressure =
        points.reduce((sum, p) => sum + (p.pressure ?? 0.5), 0) / points.length;
      const width = 2 + avgPressure * 1.5;
      drawStroke(ctx, points, width);
    }
  };

  const getCanvasCoords = (e: React.PointerEvent) => {
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
    const coords = getCanvasCoords(e);
    setPoints([{
      x: coords.x,
      y: coords.y,
      pressure: e.pressure,
      timestamp: e.timeStamp,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
      twist: e.twist
    }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    setPoints((prev) => [
      ...prev,
      {
        x: coords.x,
        y: coords.y,
        pressure: e.pressure,
        timestamp: e.timeStamp,
        tiltX: e.tiltX,
        tiltY: e.tiltY,
        twist: e.twist
      }
    ]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (points.length > 0) {
      // Calculate average pressure
      const avgPressure =
        points.reduce((sum, p) => sum + (p.pressure ?? 0.5), 0) / points.length;
      const width = 2 + avgPressure * 1.5;
      // Create a stroke from the points
      const stroke: Stroke = {
        id: uuidv4(),
        cellId: 'canvas-cell', // placeholder for now
        points: [...points],
        tool: 'pen',
        color: '#000000',
        width: width,
        smoothed: true,
        createdAt: new Date().toISOString()
      };
      addStroke(stroke);
      setPoints([]);
    }
  };

  const handlePointerLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setPoints([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md px-4 py-3 flex items-center gap-3 border-b border-gray-200 h-20 sm:h-24">
        <Image
          src="/favicon.png"
          alt="Papyr Logo"
          width={48}
          height={48}
          className="rounded-lg w-10 h-10 sm:w-12 sm:h-12"
        />
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
          Papyr
        </h1>
      </div>
      <div className="mt-20 sm:mt-24 flex-1 flex flex-col overflow-hidden">
      <div
        className="relative flex-1 border-0 overflow-hidden bg-white touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
        {!canUndo && !canRedo && strokes.length === 0 && points.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-gray-500">
            Draw with mouse, touch, or pen to test the drawing engine
          </p>
        ) : null}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            ↷ Redo
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
