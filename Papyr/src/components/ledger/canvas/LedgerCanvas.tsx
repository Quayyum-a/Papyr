'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { LedgerColumn, LedgerRow } from '@/types/ledger';
import { useInkEngine } from '@/hooks/useInkEngine';

interface LedgerCanvasProps {
  columns: LedgerColumn[];
  rows: LedgerRow[];
  width: number;
  height: number;
  pageContent?: {
    strokes: Array<{
      id: string;
      segments: Array<{ x: number; y: number; pressure: number; timestamp: number }>;
      color: string;
      size: 'extra-fine' | 'fine' | 'medium' | 'bold' | 'marker';
      cellId: string | null;
      createdAt: number;
      bounds: { minX: number; minY: number; maxX: number; maxY: number };
    }>;
  };
  onStrokeComplete?: (strokeData: any) => void;
}

export function LedgerCanvas({
  columns,
  rows,
  width,
  height,
  pageContent,
  onStrokeComplete
}: LedgerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const offscreenCtxRef = useRef<OffscreenCanvasRenderingContext2D | null>(null);
  const { 
    isDrawing, 
    strokes, 
    pointerDown, 
    pointerMove, 
    pointerUp, 
    clearStrokes,
    undo,
    redo,
    penSize,
    penColor
  } = useInkEngine();

  const [canvasWidth, setCanvasWidth] = useState(width);
  const [canvasHeight, setCanvasHeight] = useState(height);
  const [devicePixelRatio, setDevicePixelRatio] = useState(() => 
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  );

  // Initialize canvases and ink engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions based on device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    setDevicePixelRatio(dpr);
    setCanvasWidth(width * dpr);
    setCanvasHeight(height * dpr);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Create offscreen canvas for performance optimization
    const offscreen = new OffscreenCanvas(width * dpr, height * dpr);
    offscreenCanvasRef.current = offscreen;
    offscreenCtxRef.current = offscreen.getContext('2d');
    
    if (offscreenCtxRef.current) {
      // Set up offscreen canvas rendering context
      offscreenCtxRef.current.imageSmoothingEnabled = true;
      offscreenCtxRef.current.imageSmoothingQuality = 'high';
    }

    // Load existing strokes if provided
    if (pageContent?.strokes && pageContent.strokes.length > 0) {
      // Note: In a real implementation, we would deserialize and add strokes to the ink engine
      // For now, we'll rely on the ink engine's internal state being managed elsewhere
    }

    return () => {
      // Cleanup
    };
  }, [width, height, pageContent?.strokes]);

  // Handle stroke completion from ink engine
  useEffect(() => {
    if (strokes.length > 0 && onStrokeComplete) {
      // Get the latest completed stroke
      const latestStroke = strokes[strokes.length - 1];
      
      // Calculate stroke bounds
      const points = latestStroke.segments;
      if (points.length > 0) {
        let minX = points[0].x;
        let minY = points[0].y;
        let maxX = points[0].x;
        let maxY = points[0].y;
        
        for (const point of points) {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        }
        
        const strokeData = {
          id: latestStroke.id,
          segments: latestStroke.segments,
          color: latestStroke.color,
          size: latestStroke.size,
          cellId: null, // Will be set by parent component based on selection
          createdAt: Date.now(),
          bounds: { minX, minY, maxX, maxY }
        };
        
        onStrokeComplete(strokeData);
      }
    }
  }, [strokes.length, onStrokeComplete]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const offscreenCtx = offscreenCtxRef.current;
    
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
    
    if (offscreenCtx) {
      offscreenCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
    
    clearStrokes();
  }, [canvasWidth, canvasHeight, clearStrokes]);

  // Render paper background and grid
  const renderBackground = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Fill with paper color (off-white, warm)
    ctx.fillStyle = '#F8F6EE';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Add subtle paper texture (using noise pattern)
    // In a production app, we might use an actual texture image or canvas pattern
    // For now, we'll skip the texture to keep it simple and performant
    
    // Render horizontal lines (rows)
    ctx.strokeStyle = '#E5E5E5';
    ctx.lineWidth = 1 * devicePixelRatio;
    
    // Calculate row height based on available space and row count
    const rowCount = rows.length > 0 ? rows.length : 20; // Default to 20 rows if none provided
    const rowHeight = canvasHeight / rowCount;
    
    for (let i = 0; i <= rowCount; i++) {
      const y = i * rowHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
    
    // Render vertical lines (columns)
    ctx.strokeStyle = '#D8D2C2';
    ctx.lineWidth = 1 * devicePixelRatio;
    
    // Calculate column positions
    let currentX = 0;
    for (const column of columns) {
      const columnWidth = (column.width / width) * canvasWidth;
      currentX += columnWidth;
      
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, canvasHeight);
      ctx.stroke();
    }
  }, [columns, rows, canvasWidth, canvasHeight, devicePixelRatio]);

  // Render strokes (both from ink engine and saved strokes)
  const renderStrokes = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Render strokes from ink engine (real-time drawing)
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2 * devicePixelRatio; // Base width, will be adjusted by pressure
    
    if (isDrawing && pointerDown && pointerMove) {
      // Draw the current stroke being created
      ctx.beginPath();
      ctx.moveTo(pointerDown.x * devicePixelRatio, pointerDown.y * devicePixelRatio);
      
      // Use all points including the current move point
      const points = [...pointerDown.segments, pointerMove];
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        
        // Simple linear interpolation for now - in reality we'd use bezier curves
        ctx.lineTo(curr.x * devicePixelRatio, curr.y * devicePixelRatio);
      }
      
      ctx.stroke();
    }
    
    // Render completed strokes from ink engine
    for (const stroke of strokes) {
      if (stroke.segments.length < 2) continue;
      
      ctx.beginPath();
      ctx.moveTo(stroke.segments[0].x * devicePixelRatio, stroke.segments[0].y * devicePixelRatio);
      
      for (let i = 1; i < stroke.segments.length; i++) {
        const point = stroke.segments[i];
        ctx.lineTo(point.x * devicePixelRatio, point.y * devicePixelRatio);
      }
      
      ctx.stroke();
    }
  }, [isDrawing, pointerDown, pointerMove, strokes, penColor, penSize, devicePixelRatio]);

  // Render loop for continuous drawing
  useEffect(() => {
    let animationFrameId: number;
    
    const renderLoop = () => {
      // Clear and render background
      renderBackground();
      
      // Render strokes
      renderStrokes();
      
      // Composite offscreen canvas if available
      const ctx = canvasRef.current?.getContext('2d');
      const offscreen = offscreenCanvasRef.current;
      const offscreenCtx = offscreenCtxRef.current;
      
      if (ctx && offscreen && offscreenCtx) {
        // Draw offscreen to main canvas
        ctx.drawImage(offscreen, 0, 0);
      }
      
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    
    // Start render loop
    animationFrameId = requestAnimationFrame(renderLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [renderBackground, renderStrokes]);

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-100p touch-none"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        touchAction: 'none' // Prevent touch scrolling/panning on canvas
      }}
    >
      {/* The actual canvas element */}
      <canvas 
        className="absolute inset-0"
        width={canvasWidth}
        height={canvasHeight}
      />
    </div>
  );
}
