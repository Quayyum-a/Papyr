// src/types/stroke.ts

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number; // 0-1 normalized, optional for mouse/touch without pressure
  timestamp: number; // DOMHighResTimeStamp or performance.now()
  tiltX?: number; // -90 to 90 degrees
  tiltY?: number; // -90 to 90 degrees
  twist?: number; // 0 to 360 degrees
}

export interface Stroke {
  id: string; // UUID
  cellId: string; // UUID of the cell this stroke belongs to
  points: StrokePoint[];
  tool: string; // e.g., 'pen', 'pencil', 'highlighter', 'eraser'
  color: string; // CSS color string (hex, rgb, etc.)
  width: number; // base width before pressure smoothing
  smoothed: boolean; // whether the stroke has been processed by perfect-freehand
  createdAt: string; // ISO timestamp
}