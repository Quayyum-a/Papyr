import type { RawPoint } from './types';

export interface PressureData {
  pressures: number[];
  velocities: number[];
}

const MIN_VELOCITY = 5;
const MAX_VELOCITY = 300;

export function simulatePressure(points: RawPoint[]): PressureData {
  if (points.length < 2) {
    return {
      pressures: points.map(() => 0.5),
      velocities: points.map(() => 0),
    };
  }

  const velocities: number[] = [];
  const pressures: number[] = [];

  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      velocities.push(0);
    } else {
      const dt = points[i].t - points[i - 1].t;
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const velocity = dt > 0 ? distance / dt : 0;
      velocities.push(Math.min(velocity, MAX_VELOCITY));
    }
  }

  for (let i = 0; i < points.length; i++) {
    if (points[i].pressure !== undefined) {
      pressures.push(points[i].pressure!);
    } else {
      const velocity = velocities[i];
      const normalizedVelocity = Math.min(velocity / MAX_VELOCITY, 1.0);
      const pressure = 0.3 + (1.0 - normalizedVelocity) * 0.7;
      pressures.push(pressure);
    }
  }

  return { pressures, velocities };
}

export function smoothPressure(pressures: number[], factor: number): number[] {
  const smoothed: number[] = [];

  for (let i = 0; i < pressures.length; i++) {
    let sum = pressures[i];
    let count = 1;

    const lookback = Math.min(i, 2);
    for (let j = 1; j <= lookback; j++) {
      sum += pressures[i - j];
      count++;
    }

    const lookahead = Math.min(pressures.length - i - 1, 2);
    for (let j = 1; j <= lookahead; j++) {
      sum += pressures[i + j];
      count++;
    }

    smoothed.push(sum / count);
  }

  return smoothed.map(p => 0.3 + (p - 0.3) * factor);
}
