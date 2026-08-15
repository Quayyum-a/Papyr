/**
 * Ink Recognition Utilities
 *
 * Functions for capturing cell ink as images and recognizing handwritten text
 * via OpenRouter vision models.
 */

import { getCellBounds, getExpandedCellBounds, type LedgerConfig, type CellCoordinates } from '@/types/ledger';
import type { Stroke } from './ink-engine/types';

/**
 * Compute the bounding box that encompasses all given strokes, plus padding
 * @param strokes - Array of strokes to compute bounds for
 * @param padding - Padding in pixels to add around the bounds (default: 8)
 * @returns Bounds object with x, y, width, height, or null if no strokes
 */
export function computeStrokesBounds(
  strokes: Stroke[],
  padding: number = 8
): { x: number; y: number; width: number; height: number } | null {
  if (strokes.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    // Use stroke's own bounds property (preferred - already computed)
    if (stroke.bounds) {
      minX = Math.min(minX, stroke.bounds.minX);
      minY = Math.min(minY, stroke.bounds.minY);
      maxX = Math.max(maxX, stroke.bounds.maxX);
      maxY = Math.max(maxY, stroke.bounds.maxY);
    } else {
      // Fallback: compute from segments if bounds not available
      // Segment points are tuples [x, y]
      for (const segment of stroke.segments) {
        if (segment.p0) {
          minX = Math.min(minX, segment.p0[0]);
          minY = Math.min(minY, segment.p0[1]);
          maxX = Math.max(maxX, segment.p0[0]);
          maxY = Math.max(maxY, segment.p0[1]);
        }
        if (segment.p1) {
          minX = Math.min(minX, segment.p1[0]);
          minY = Math.min(minY, segment.p1[1]);
          maxX = Math.max(maxX, segment.p1[0]);
          maxY = Math.max(maxY, segment.p1[1]);
        }
        if (segment.p2) {
          minX = Math.min(minX, segment.p2[0]);
          minY = Math.min(minY, segment.p2[1]);
          maxX = Math.max(maxX, segment.p2[0]);
          maxY = Math.max(maxY, segment.p2[1]);
        }
        if (segment.p3) {
          minX = Math.min(minX, segment.p3[0]);
          minY = Math.min(minY, segment.p3[1]);
          maxX = Math.max(maxX, segment.p3[0]);
          maxY = Math.max(maxY, segment.p3[1]);
        }
      }
    }
  }

  // Check if we found any valid coordinates
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return null;
  }

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

/**
 * Captures the ink within a specific cell as a base64 PNG data URL
 * Uses actual stroke bounds for the current writing session, with fallback to expanded cell bounds
 *
 * @param inkCanvas - The canvas element containing all ink strokes
 * @param ledgerConfig - The ledger configuration with column definitions
 * @param cellCoords - The coordinates of the cell to capture
 * @param strokes - Optional array of strokes for the current session. If provided, bounds are computed from these strokes.
 * @returns Base64 PNG data URL, or null if cell is invalid or has no bounds
 */
export function captureCellImage(
  inkCanvas: HTMLCanvasElement,
  ledgerConfig: LedgerConfig,
  cellCoords: CellCoordinates,
  strokes?: Stroke[]
): string | null {
  // If strokes are provided, compute bounds from actual ink
  // Otherwise fall back to expanded cell bounds (for backward compatibility)
  let bounds: { x: number; y: number; width: number; height: number } | null = null;

  if (strokes && strokes.length > 0) {
    bounds = computeStrokesBounds(strokes);
  }

  // Fallback to expanded cell bounds if no strokes or computation failed
  if (!bounds) {
    bounds = getExpandedCellBounds(ledgerConfig, cellCoords.columnIndex, cellCoords.rowIndex);
  }

  if (!bounds) {
    return null;
  }

  // Create an offscreen canvas for the cell crop
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = bounds.width;
  offscreenCanvas.height = bounds.height;

  const ctx = offscreenCanvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  // Draw the cell region from the ink canvas onto the offscreen canvas
  ctx.drawImage(
    inkCanvas,
    bounds.x, bounds.y, bounds.width, bounds.height,  // Source rect
    0, 0, bounds.width, bounds.height                  // Dest rect
  );

  // Export as PNG data URL
  return offscreenCanvas.toDataURL('image/png');
}

/**
 * Check if a cell has any ink strokes
 * 
 * @param strokes - All strokes in the ledger
 * @param cellId - The cell ID to check (format: "col-{colIndex}-row-{rowIndex}")
 * @returns True if the cell has at least one stroke
 */
export function cellHasInk(strokes: Stroke[], cellId: string): boolean {
  return strokes.some(stroke => stroke.cell_id === cellId);
}

/**
 * Call the recognition API to transcribe handwritten text in an image
 * Calls OpenRouter vision models directly.
 *
 * @param imageDataUrl - Base64 PNG data URL of the cell image
 * @param columnLabel - Optional column label for context-aware recognition
 * @returns Recognized text, or null if recognition fails
 */
export async function recognizeInk(
  imageDataUrl: string,
  columnLabel?: string
): Promise<string | null> {
  // Call OpenRouter (primary method)
  try {
    const openRouterResponse = await fetch('/api/ink/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageDataUrl,
        columnLabel,
      }),
    });

    if (!openRouterResponse.ok) {
      console.error('[Recognition] OpenRouter returned non-OK status:', openRouterResponse.status);
      return null;
    }

    const openRouterData = await openRouterResponse.json();

    if (openRouterData.error) {
      console.error('[Recognition] OpenRouter returned error:', openRouterData.error);
      return null;
    }

    console.log('[Recognition] OpenRouter succeeded:', {
      text: openRouterData.text,
      model: openRouterData.model,
    });

    return openRouterData.text ?? null;
  } catch (error) {
    console.error('[Recognition] OpenRouter error:', error);
    return null;
  }
}
