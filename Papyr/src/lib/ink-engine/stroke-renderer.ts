import type { RawPoint, StrokeSegment, PenConfig } from './types';
import { simulatePressure, smoothPressure } from './pressure-simulator';

const TAIL_POINTS = 20; // Number of recent points to process for real-time rendering

export class StrokeRenderer {
  private config: PenConfig;

  constructor(config: PenConfig) {
    this.config = config;
  }

  renderStroke(points: RawPoint[]): StrokeSegment[] {
    if (points.length < 2) return [];

    const { pressures } = simulatePressure(points);
    const smoothedPressures = smoothPressure(pressures, this.config.smoothing);
    const smoothedPoints = this.catmullRomSmoothing(points);

    const segments: StrokeSegment[] = [];

    for (let i = 0; i < smoothedPoints.length - 1; i++) {
      const p0 = smoothedPoints[i];
      const p3 = smoothedPoints[i + 1];

      const p1 = this.controlPoint(smoothedPoints, i, true);
      const p2 = this.controlPoint(smoothedPoints, i + 1, false);

      const widthStart = this.calculateWidth(smoothedPressures[i]);
      const widthEnd = this.calculateWidth(smoothedPressures[i + 1]);

      segments.push({
        p0: [p0.x, p0.y],
        p1: [p1.x, p1.y],
        p2: [p2.x, p2.y],
        p3: [p3.x, p3.y],
        widthStart,
        widthEnd,
        pressureStart: smoothedPressures[i],
        pressureEnd: smoothedPressures[i + 1],
      });
    }

    return segments;
  }

  /**
   * Render only the tail of a stroke for real-time display.
   * Processes only the last TAIL_POINTS raw points for performance.
   */
  renderStrokeTail(points: RawPoint[]): StrokeSegment[] {
    if (points.length < 2) return [];

    // For short strokes, use full rendering
    if (points.length <= TAIL_POINTS) {
      return this.renderStroke(points);
    }

    // For long strokes, only process the tail
    const tailPoints = points.slice(-TAIL_POINTS);

    const { pressures } = simulatePressure(tailPoints);
    const smoothedPressures = smoothPressure(pressures, this.config.smoothing);
    const smoothedPoints = this.catmullRomSmoothing(tailPoints);

    const segments: StrokeSegment[] = [];

    for (let i = 0; i < smoothedPoints.length - 1; i++) {
      const p0 = smoothedPoints[i];
      const p3 = smoothedPoints[i + 1];

      const p1 = this.controlPoint(smoothedPoints, i, true);
      const p2 = this.controlPoint(smoothedPoints, i + 1, false);

      const widthStart = this.calculateWidth(smoothedPressures[i]);
      const widthEnd = this.calculateWidth(smoothedPressures[i + 1]);

      segments.push({
        p0: [p0.x, p0.y],
        p1: [p1.x, p1.y],
        p2: [p2.x, p2.y],
        p3: [p3.x, p3.y],
        widthStart,
        widthEnd,
        pressureStart: smoothedPressures[i],
        pressureEnd: smoothedPressures[i + 1],
      });
    }

    return segments;
  }

  private catmullRomSmoothing(points: RawPoint[]): RawPoint[] {
    if (points.length < 2) return points;

    const smoothed: RawPoint[] = [];

    for (let i = 0; i < points.length; i++) {
      smoothed.push(points[i]);

      if (i < points.length - 1) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        for (let t = 0.25; t < 1; t += 0.25) {
          const intermediate = this.catmullRom(p0, p1, p2, p3, t);
          smoothed.push(intermediate);
        }
      }
    }

    return smoothed;
  }

  private catmullRom(p0: RawPoint, p1: RawPoint, p2: RawPoint, p3: RawPoint, t: number): RawPoint {
    const t2 = t * t;
    const t3 = t2 * t;

    const v0 = (p2.x - p0.x) * 0.5;
    const v1 = (p3.x - p1.x) * 0.5;
    const x = p1.x + v0 * t + (3 * (p2.x - p1.x) - 2 * v0 - v1) * t2 + (2 * (p1.x - p2.x) + v0 + v1) * t3;

    const v0y = (p2.y - p0.y) * 0.5;
    const v1y = (p3.y - p1.y) * 0.5;
    const y = p1.y + v0y * t + (3 * (p2.y - p1.y) - 2 * v0y - v1y) * t2 + (2 * (p1.y - p2.y) + v0y + v1y) * t3;

    return { x, y, t: p1.t + (p2.t - p1.t) * t, pressure: p1.pressure };
  }

  private controlPoint(points: RawPoint[], index: number, isFirst: boolean): RawPoint {
    const p1 = points[index];
    const p2 = points[index + 1];

    if (isFirst && index > 0) {
      const p0 = points[index - 1];
      return {
        x: p1.x + (p2.x - p0.x) * 0.2,
        y: p1.y + (p2.y - p0.y) * 0.2,
        t: p1.t,
      };
    } else if (!isFirst && index + 2 < points.length) {
      const p3 = points[index + 2];
      return {
        x: p2.x - (p3.x - p1.x) * 0.2,
        y: p2.y - (p3.y - p1.y) * 0.2,
        t: p2.t,
      };
    }

    return isFirst ? p2 : p1;
  }

  private calculateWidth(pressure: number): number {
    const { minWidth, maxWidth } = this.config;
    return minWidth + (maxWidth - minWidth) * pressure;
  }

  drawSegment(ctx: CanvasRenderingContext2D, segment: StrokeSegment, steps = 20): void {
    const outline: { top: [number, number][]; bottom: [number, number][] } = { top: [], bottom: [] };

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = this.bezierPoint(segment, t);
      const width = segment.widthStart + (segment.widthEnd - segment.widthStart) * t;

      const normal = this.perpendicular(segment, t);
      const offset = width / 2;

      outline.top.push([point.x + normal.x * offset, point.y + normal.y * offset]);
      outline.bottom.unshift([point.x - normal.x * offset, point.y - normal.y * offset]);
    }

    this.fillPath(ctx, [...outline.top, ...outline.bottom]);
  }

  private bezierPoint(segment: StrokeSegment, t: number): { x: number; y: number } {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    const x =
      mt3 * segment.p0[0] + 3 * mt2 * t * segment.p1[0] + 3 * mt * t2 * segment.p2[0] + t3 * segment.p3[0];
    const y =
      mt3 * segment.p0[1] + 3 * mt2 * t * segment.p1[1] + 3 * mt * t2 * segment.p2[1] + t3 * segment.p3[1];

    return { x, y };
  }

  private perpendicular(segment: StrokeSegment, t: number): { x: number; y: number } {
    const eps = 0.001;
    const p1 = this.bezierPoint(segment, Math.max(0, t - eps));
    const p2 = this.bezierPoint(segment, Math.min(1, t + eps));

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) return { x: 0, y: 1 };

    return { x: -dy / len, y: dx / len };
  }

  private fillPath(ctx: CanvasRenderingContext2D, path: [number, number][]): void {
    if (path.length < 3) return;

    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i][0], path[i][1]);
    }

    ctx.closePath();
    ctx.fill();
  }
}
