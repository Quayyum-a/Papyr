// src/types/stroke.ts
export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
  tiltX?: number;
  tiltY?: number;
  twist?: number;
}

export interface Stroke {
  id: string;
  cellId: string;
  points: Point[];
  tool: string;
  color: string; // hex color
  width: number;
  smoothed: boolean;
  createdAt: string; // ISO string
}