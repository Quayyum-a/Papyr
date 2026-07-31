import { useEffect, useRef } from 'react';
import * as perfectFreehand from 'perfect-freehand';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let stroke: ReturnType<typeof perfectFreehand> | null = null;
    let isDrawing = false;

    const start = (e: PointerEvent) => {
      isDrawing = true;
      stroke = perfectFreehand();
      stroke.moveTo(e.clientX, e.clientY);
    };

    const draw = (e: PointerEvent) => {
      if (!isDrawing || !stroke) return;
      stroke.lineTo(e.clientX, e.clientY);

      // Draw the stroke
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const points = stroke.getPoints();

      if (points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const point = points[i];
        ctx.lineTo(point.x, point.y);
      }
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const end = () => {
      isDrawing = false;
      stroke = null;
    };

    // Pointer events for touch, pen, and mouse
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointerleave', end);
    canvas.addEventListener('pointercancel', end);

    // Cleanup
    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', draw);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointerleave', end);
      canvas.removeEventListener('pointercancel', end);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Papyr - Handwritten Digital Ledger
      </h1>
      <div
        className="w-full max-w-2xl h-96 border-2 border-dashed border-gray-300 rounded-lg relative"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
        />
        {!canvasRef.current ? (
          <p className="absolute inset-0 flex items-center justify-center text-gray-500">
            Loading canvas...
          </p>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Draw with mouse, touch, or pen to test the drawing engine
      </p>
    </div>
  );
}