/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import { Stroke, StrokePoint } from './stroke';

describe('Stroke types', () => {
  it('StrokePoint interface has required properties', () => {
    const point: StrokePoint = {
      x: 100,
      y: 200,
      timestamp: Date.now(),
    };
    expect(point).toHaveProperty('x');
    expect(point).toHaveProperty('y');
    expect(point).toHaveProperty('timestamp');
  });

  it('Stroke interface has required properties', () => {
    const stroke: Stroke = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      cellId: '123e4567-e89b-12d3-a456-426614174001',
      points: [
        { x: 0, y: 0, timestamp: 0 },
        { x: 10, y: 10, timestamp: 16 },
      ],
      tool: 'pen',
      color: '#000000',
      width: 2.0,
      smoothed: true,
      createdAt: new Date().toISOString(),
    };
    expect(stroke).toHaveProperty('id');
    expect(stroke).toHaveProperty('cellId');
    expect(stroke).toHaveProperty('points');
    expect(stroke).toHaveProperty('tool');
    expect(stroke).toHaveProperty('color');
    expect(stroke).toHaveProperty('width');
    expect(stroke).toHaveProperty('smoothed');
    expect(stroke).toHaveProperty('createdAt');
  });
});