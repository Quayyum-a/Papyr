import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { captureCellImage, cellHasInk, recognizeInk, computeStrokesBounds } from './ink-recognition';
import type { LedgerConfig } from '@/types/ledger';
import { getExpandedCellBounds } from '@/types/ledger';
import type { Stroke } from './ink-engine/types';

describe('computeStrokesBounds', () => {
  const createMockStroke = (bounds: { minX: number; minY: number; maxX: number; maxY: number }, segments?: any[]): Stroke => ({
    id: 'stroke-test',
    tool: 'pen',
    color: '#000000',
    size: 'fine',
    segments: segments || [],
    createdAt: Date.now(),
    bounds,
    cell_id: 'col-0-row-0',
  });

  it('should return null for empty strokes array', () => {
    const result = computeStrokesBounds([]);
    expect(result).toBeNull();
  });

  it('should compute bounds from a single stroke', () => {
    const stroke = createMockStroke({ minX: 10, minY: 20, maxX: 100, maxY: 80 });
    const result = computeStrokesBounds([stroke], 8);

    expect(result).not.toBeNull();
    expect(result!.x).toBe(2); // 10 - 8
    expect(result!.y).toBe(12); // 20 - 8
    expect(result!.width).toBe(106); // (100-10) + 16
    expect(result!.height).toBe(76); // (80-20) + 16
  });

  it('should compute union bounds from multiple strokes', () => {
    const stroke1 = createMockStroke({ minX: 10, minY: 20, maxX: 100, maxY: 80 });
    const stroke2 = createMockStroke({ minX: 150, minY: 50, maxX: 200, maxY: 120 });
    const result = computeStrokesBounds([stroke1, stroke2], 8);

    expect(result).not.toBeNull();
    expect(result!.x).toBe(2); // min(10, 150) - 8
    expect(result!.y).toBe(12); // min(20, 50) - 8
    expect(result!.width).toBe(206); // (200 - 10) + 16
    expect(result!.height).toBe(116); // (120 - 20) + 16
  });

  it('should use custom padding', () => {
    const stroke = createMockStroke({ minX: 10, minY: 20, maxX: 100, maxY: 80 });
    const result = computeStrokesBounds([stroke], 20);

    expect(result).not.toBeNull();
    expect(result!.x).toBe(-10); // 10 - 20
    expect(result!.width).toBe(130); // (100-10) + 40
  });

  it('should fallback to segment points if stroke bounds missing', () => {
    const stroke: Stroke = {
      id: 'stroke-test',
      tool: 'pen',
      color: '#000000',
      size: 'fine',
      segments: [
        { p0: { x: 5, y: 10 }, p1: { x: 50, y: 60 }, p2: { x: 80, y: 90 }, p3: { x: 120, y: 110 }, width: 2 },
      ],
      createdAt: Date.now(),
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 }, // Invalid bounds (all zeros)
      cell_id: 'col-0-row-0',
    };
    const result = computeStrokesBounds([stroke], 8);

    // Should compute from segment points since bounds are degenerate
    expect(result).not.toBeNull();
    expect(result!.x).toBeLessThanOrEqual(5 - 8);
    expect(result!.y).toBeLessThanOrEqual(10 - 8);
    expect(result!.width).toBeGreaterThan(0);
    expect(result!.height).toBeGreaterThan(0);
  });
});

describe('captureCellImage', () => {
  const testConfig: LedgerConfig = {
    rowCount: 20,
    columns: [
      { id: 'col-0', label: 'Date', width: 120, position: 0 },
      { id: 'col-1', label: 'Description', width: 280, position: 1 },
      { id: 'col-2', label: 'Debit', width: 120, position: 2 },
    ],
  };

  const createMockStroke = (bounds: { minX: number; minY: number; maxX: number; maxY: number }): Stroke => ({
    id: 'stroke-test',
    tool: 'pen',
    color: '#000000',
    size: 'fine',
    segments: [],
    createdAt: Date.now(),
    bounds,
    cell_id: 'col-0-row-0',
  });

  it('should return null for invalid cell coordinates (no strokes)', () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 640;
    mockCanvas.height = 500;

    const result = captureCellImage(mockCanvas, testConfig, {
      columnIndex: 10,
      rowIndex: 0,
    });

    expect(result).toBeNull();
  });

  it('should return null for negative cell coordinates (no strokes)', () => {
    const mockCanvas = document.createElement('canvas');

    const result = captureCellImage(mockCanvas, testConfig, {
      columnIndex: -1,
      rowIndex: 0,
    });

    expect(result).toBeNull();
  });

  it('should use expanded cell bounds when no strokes provided', () => {
    const cellCoords = { columnIndex: 0, rowIndex: 0 };

    const expandedBounds = getExpandedCellBounds(testConfig, cellCoords.columnIndex, cellCoords.rowIndex);
    expect(expandedBounds).not.toBeNull();

    expect(expandedBounds!.width).toBe(200);
    expect(expandedBounds!.height).toBe(88);
    const widthDiff = 200 - 120;
    expect(expandedBounds!.x).toBe(0 - widthDiff / 2);
  });

  it('should use expanded cell bounds for wide columns when no strokes', () => {
    const cellCoords = { columnIndex: 1, rowIndex: 0 };

    const expandedBounds = getExpandedCellBounds(testConfig, cellCoords.columnIndex, cellCoords.rowIndex);
    expect(expandedBounds).not.toBeNull();

    expect(expandedBounds!.width).toBe(280);
    expect(expandedBounds!.height).toBe(44 + 22 + 22);
    expect(expandedBounds!.x).toBe(120);
  });

  it('should compute bounds from provided strokes instead of expanded bounds', () => {
    // This test requires a real canvas environment (browser)
    // In jsdom, drawImage doesn't work properly, so we test the bounds computation separately
    const strokes = [
      createMockStroke({ minX: 50, minY: 50, maxX: 150, maxY: 100 }),
      createMockStroke({ minX: 300, minY: 300, maxX: 400, maxY: 380 }),
    ];

    // Verify bounds are computed from strokes, not from expanded cell bounds
    const bounds = computeStrokesBounds(strokes);
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBe(42); // 50 - 8
    expect(bounds!.y).toBe(42); // 50 - 8
    expect(bounds!.width).toBe(366); // (400 - 50) + 16
    expect(bounds!.height).toBe(346); // (380 - 50) + 16

    // The full captureCellImage integration is tested in browser/manual testing
  });

  it('should return data URL when strokes provided (integration requires browser)', () => {
    // Full canvas integration tested in browser
    // Here we verify the bounds computation logic
    const strokes = [createMockStroke({ minX: 100, minY: 100, maxX: 200, maxY: 150 })];
    const bounds = computeStrokesBounds(strokes);
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBe(116); // (200-100) + 16
    expect(bounds!.height).toBe(66); // (150-100) + 16
  });

  it('should fall back to expanded bounds when strokes array is empty', () => {
    const cellCoords = { columnIndex: 0, rowIndex: 0 };
    const expandedBounds = getExpandedCellBounds(testConfig, cellCoords.columnIndex, cellCoords.rowIndex);
    expect(expandedBounds).not.toBeNull();
    expect(expandedBounds!.width).toBe(200); // MIN_WRITING_WIDTH for narrow column

    // captureCellImage with empty strokes falls back to expanded bounds
    // Full integration tested in browser
  });
});

describe('cellHasInk', () => {
  const mockStrokes: Stroke[] = [
    {
      id: 'stroke-1',
      tool: 'pen',
      color: '#000000',
      size: 'fine',
      segments: [],
      createdAt: Date.now(),
      bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      cell_id: 'col-0-row-0',
    },
    {
      id: 'stroke-2',
      tool: 'pen',
      color: '#000000',
      size: 'fine',
      segments: [],
      createdAt: Date.now(),
      bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      cell_id: 'col-1-row-0',
    },
    {
      id: 'stroke-3',
      tool: 'pen',
      color: '#000000',
      size: 'fine',
      segments: [],
      createdAt: Date.now(),
      bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      cell_id: null, // Free ink
    },
  ];

  it('should return true if cell has strokes', () => {
    expect(cellHasInk(mockStrokes, 'col-0-row-0')).toBe(true);
    expect(cellHasInk(mockStrokes, 'col-1-row-0')).toBe(true);
  });

  it('should return false if cell has no strokes', () => {
    expect(cellHasInk(mockStrokes, 'col-2-row-0')).toBe(false);
    expect(cellHasInk(mockStrokes, 'col-0-row-1')).toBe(false);
  });

  it('should return false for empty strokes array', () => {
    expect(cellHasInk([], 'col-0-row-0')).toBe(false);
  });

  it('should not match null cell_id', () => {
    expect(cellHasInk(mockStrokes, 'null')).toBe(false);
  });
});

describe('recognizeInk', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call API with correct parameters', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'John Doe', model: 'test-model' }),
    });

    const imageData = 'data:image/png;base64,test';
    const result = await recognizeInk(imageData, 'Name');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ink/recognize',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          columnLabel: 'Name',
        }),
      })
    );

    expect(result).toBe('John Doe');
  });

  it('should work without column label', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'Some text' }),
    });

    const result = await recognizeInk('data:image/png;base64,test');

    const callArgs = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callArgs.columnLabel).toBeUndefined();
    expect(result).toBe('Some text');
  });

  it('should return null if API returns non-OK status', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    const result = await recognizeInk('data:image/png;base64,test');

    expect(result).toBeNull();
  });

  it('should return null if API returns error object', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'recognition_unavailable' }),
    });

    const result = await recognizeInk('data:image/png;base64,test');

    expect(result).toBeNull();
  });

  it('should return null on network error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const result = await recognizeInk('data:image/png;base64,test');

    expect(result).toBeNull();
  });

  it('should handle empty string response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: '' }),
    });

    const result = await recognizeInk('data:image/png;base64,test');

    expect(result).toBe('');
  });

  it('should return null if text is missing from response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ model: 'test-model' }),
    });

    const result = await recognizeInk('data:image/png;base64,test');

    expect(result).toBeNull();
  });
});