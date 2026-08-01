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
    ctx.stroke();
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
      // Calculate average pressure for current points
      const avgPressure =
        points.reduce((sum, p) => sum + (p.pressure ?? 0.5), 0) / points.length;
      const width = 0.5 + avgPressure * 2.5; // maps [0,1] to [0.5, 3.0]
      drawStroke(ctx, points, width);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDrawing(true);
    setPoints([{
      x: e.clientX,
      y: e.clientY,
      pressure: e.pressure,
      timestamp: e.timeStamp,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
      twist: e.twist
    }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setPoints((prev) => [
      ...prev,
      {
        x: e.clientX,
        y: e.clientY,
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
      const width = 0.5 + avgPressure * 2.5; // maps [0,1] to [0.5, 3.0]
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
    <div className="min-h-screen bg-gray-50 flex flex-col p-4">
      <div className="flex items-center gap-3 mb-6">
        <Image
          src="/favicon.png"
          alt="Papyr Logo"
          width={48}
          height={48}
          className="rounded"
        />
        <h1 className="text-3xl font-bold text-gray-800">
          Papyr
        </h1>
      </div>
      <div
        className="relative flex-1 border-2 border-dashed border-gray-300 rounded-lg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
        {!canUndo && !canRedo && strokes.length === 0 && points.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-gray-500">
            Draw with mouse, touch, or pen to test the drawing engine
          </p>
        ) : null}
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Undo (Ctrl+Z)
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Redo (Ctrl+Y)
          </button>
        </div>
      </div>
    </div>
  );
}
