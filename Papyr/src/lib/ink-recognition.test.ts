import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { captureCellImage, cellHasInk, recognizeInk } from './ink-recognition';
import type { LedgerConfig } from '@/types/ledger';
import type { Stroke } from './ink-engine/types';

describe('captureCellImage', () => {
  const testConfig: LedgerConfig = {
    rowCount: 20,
    columns: [
      { id: 'col-0', label: 'Date', width: 120, position: 0 },
      { id: 'col-1', label: 'Description', width: 280, position: 1 },
      { id: 'col-2', label: 'Debit', width: 120, position: 2 },
    ],
  };

  it('should return null for invalid cell coordinates', () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 640;
    mockCanvas.height = 500;

    const result = captureCellImage(mockCanvas, testConfig, {
      columnIndex: 10,
      rowIndex: 0,
    });

    expect(result).toBeNull();
  });

  it('should return null for negative cell coordinates', () => {
    const mockCanvas = document.createElement('canvas');
    
    const result = captureCellImage(mockCanvas, testConfig, {
      columnIndex: -1,
      rowIndex: 0,
    });

    expect(result).toBeNull();
  });

  // Note: Full canvas drawing tests are skipped in jsdom environment
  // These are tested in the browser during manual testing
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
