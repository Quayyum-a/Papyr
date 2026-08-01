import { StrokeRenderer } from './stroke-renderer';
import type { Stroke, StrokeSegment, PenConfig } from './types';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private strokeRenderer: StrokeRenderer;
  private dpr: number;

  constructor(canvas: HTMLCanvasElement, penConfig: PenConfig) {
    this.canvas = canvas;
    this.dpr = window.devicePixelRatio || 1;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;

    const offscreenCtx = this.offscreenCanvas.getContext('2d');
    if (!offscreenCtx) throw new Error('Failed to get offscreen 2D context');
    this.offscreenCtx = offscreenCtx;

    this.strokeRenderer = new StrokeRenderer(penConfig);

    this.setupContext();
  }

  private setupContext() {
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.offscreenCtx.imageSmoothingEnabled = true;
    this.offscreenCtx.imageSmoothingQuality = 'high';
  }

  clear() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    this.offscreenCtx.fillStyle = '#ffffff';
    this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
  }

  renderCompletedStrokes(strokes: Stroke[]) {
    this.offscreenCtx.fillStyle = '#000000';

    for (const stroke of strokes) {
      for (const segment of stroke.segments) {
        this.strokeRenderer.drawSegment(this.offscreenCtx, segment);
      }
    }

    this.composite();
  }

  renderSegment(segment: StrokeSegment) {
    this.ctx.fillStyle = '#000000';
    this.strokeRenderer.drawSegment(this.ctx, segment);
  }

  renderCurrentStroke(stroke: Stroke) {
    this.ctx.fillStyle = '#000000';

    for (const segment of stroke.segments) {
      this.strokeRenderer.drawSegment(this.ctx, segment);
    }
  }

  private composite() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.drawImage(this.offscreenCanvas, 0, 0, rect.width, rect.height);
  }

  resetOffscreen() {
    const rect = this.canvas.getBoundingClientRect();
    this.offscreenCtx.fillStyle = '#ffffff';
    this.offscreenCtx.fillRect(0, 0, rect.width, rect.height);
  }
}
