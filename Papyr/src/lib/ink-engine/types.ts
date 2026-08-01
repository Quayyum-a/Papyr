export interface RawPoint {
  x: number;
  y: number;
  t: number;
  pressure?: number;
  tiltX?: number;
  tiltY?: number;
}

export interface StrokeSegment {
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  p3: [number, number];
  widthStart: number;
  widthEnd: number;
  pressureStart: number;
  pressureEnd: number;
}

export type PenSize = 'extra-fine' | 'fine' | 'medium' | 'bold' | 'marker';

export interface PenConfig {
  size: PenSize;
  color: string;
  minWidth: number;
  maxWidth: number;
  smoothing: number;
  taperingFactor: number;
}

export interface Stroke {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  size: PenSize;
  segments: StrokeSegment[];
  createdAt: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export const PEN_CONFIGS: Record<PenSize, Omit<PenConfig, 'color'>> = {
  'extra-fine': { size: 'extra-fine', minWidth: 0.6, maxWidth: 1.2, smoothing: 0.85, taperingFactor: 1.8 },
  fine: { size: 'fine', minWidth: 1.0, maxWidth: 1.6, smoothing: 0.8, taperingFactor: 1.6 },
  medium: { size: 'medium', minWidth: 1.4, maxWidth: 2.2, smoothing: 0.75, taperingFactor: 1.4 },
  bold: { size: 'bold', minWidth: 2.0, maxWidth: 3.2, smoothing: 0.65, taperingFactor: 1.2 },
  marker: { size: 'marker', minWidth: 4.0, maxWidth: 6.0, smoothing: 0.5, taperingFactor: 0.8 },
};
