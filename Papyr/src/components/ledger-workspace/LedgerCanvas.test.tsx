import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LedgerCanvas } from './LedgerCanvas';
import type { LedgerConfig } from '@/types/ledger';
import type { Stroke } from '@/lib/ink-engine/types';

// Mock canvas context
const mockGetContext = vi.fn(() => ({
  scale: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(400), // 10x10 image
    width: 10,
    height: 10,
  })),
  putImageData: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  drawImage: vi.fn(),
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  canvas: {
    width: 800,
    height: 600,
  },
}));

// Mock canvas element
HTMLCanvasElement.prototype.getContext = mockGetContext as any;
HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  right: 800,
  bottom: 600,
  x: 0,
  y: 0,
  toJSON: () => ({}),
})) as any;

describe('LedgerCanvas', () => {
  const mockLedgerConfig: LedgerConfig = {
    columns: [
      { id: '1', label: 'Date', width: 120, position: 0 },
      { id: '2', label: 'Description', width: 280, position: 1 },
      { id: '3', label: 'Debit', width: 120, position: 2 },
      { id: '4', label: 'Credit', width: 120, position: 3 },
    ],
    rowCount: 20,
  };

  const mockStrokes: Stroke[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render three canvas elements', () => {
    const { container } = render(
      <LedgerCanvas
        ledgerConfig={mockLedgerConfig}
        strokes={mockStrokes}
        currentStroke={null}
        currentPenSize="medium"
        currentColor="#000000"
      />
    );

    const canvases = container.querySelectorAll('canvas');
    expect(canvases).toHaveLength(3);
  });

  it('should apply correct z-index to layers', () => {
    const { container } = render(
      <LedgerCanvas
        ledgerConfig={mockLedgerConfig}
        strokes={mockStrokes}
        currentStroke={null}
        currentPenSize="medium"
        currentColor="#000000"
      />
    );

    const canvases = container.querySelectorAll('canvas');
    expect(canvases[0]).toHaveStyle({ zIndex: '1' }); // Paper
    expect(canvases[1]).toHaveStyle({ zIndex: '1' }); // Grid
    expect(canvases[2]).toHaveStyle({ zIndex: '2' }); // Ink
  });

  it('should disable pointer events on ink layer', () => {
    const { container } = render(
      <LedgerCanvas
        ledgerConfig={mockLedgerConfig}
        strokes={mockStrokes}
        currentStroke={null}
        currentPenSize="medium"
        currentColor="#000000"
      />
    );

    const inkCanvas = container.querySelectorAll('canvas')[2];
    expect(inkCanvas).toHaveClass('pointer-events-none');
  });

  it('should set touchAction to none to prevent default behaviors', () => {
    const { container } = render(
      <LedgerCanvas
        ledgerConfig={mockLedgerConfig}
        strokes={mockStrokes}
        currentStroke={null}
        currentPenSize="medium"
        currentColor="#000000"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ touchAction: 'none' });
  });

  it('should call onPointerDown handler', () => {
    const handlePointerDown = vi.fn();
    
    const { container } = render(
      <LedgerCanvas
        ledgerConfig={mockLedgerConfig}
        strokes={mockStrokes}
        currentStroke={null}
        currentPenSize="medium"
        currentColor="#000000"
        onPointerDown={handlePointerDown}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    const event = new PointerEvent('pointerdown', { bubbles: true });
    wrapper.dispatchEvent(event);

    expect(handlePointerDown).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LedgerCanvas
        ledgerConfig={mockLedgerConfig}
        strokes={mockStrokes}
        currentStroke={null}
        currentPenSize="medium"
        currentColor="#000000"
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should initialize canvas contexts', () => {
    render(
      <LedgerCanvas
        ledgerConfig={mockLedgerConfig}
        strokes={mockStrokes}
        currentStroke={null}
        currentPenSize="medium"
        currentColor="#000000"
      />
    );

    // Should request 2D context for each canvas (3 visible + 1 offscreen)
    expect(mockGetContext).toHaveBeenCalledWith('2d');
    expect(mockGetContext).toHaveBeenCalledTimes(4);
  });
});
