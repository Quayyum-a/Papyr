/**
 * Ink Recognition Utilities
 * 
 * Functions for capturing cell ink as images and recognizing handwritten text
 * via OpenRouter vision models.
 */

import { getCellBounds, type LedgerConfig, type CellCoordinates } from '@/types/ledger';
import type { Stroke } from './ink-engine/types';

/**
 * Captures the ink within a specific cell as a base64 PNG data URL
 * 
 * @param inkCanvas - The canvas element containing all ink strokes
 * @param ledgerConfig - The ledger configuration with column definitions
 * @param cellCoords - The coordinates of the cell to capture
 * @returns Base64 PNG data URL, or null if cell is invalid or has no bounds
 */
export function captureCellImage(
  inkCanvas: HTMLCanvasElement,
  ledgerConfig: LedgerConfig,
  cellCoords: CellCoordinates
): string | null {
  const bounds = getCellBounds(ledgerConfig, cellCoords.columnIndex, cellCoords.rowIndex);
  
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
 * 
 * @param imageDataUrl - Base64 PNG data URL of the cell image
 * @param columnLabel - Optional column label for context-aware recognition
 * @returns Recognized text, or null if recognition fails
 */
export async function recognizeInk(
  imageDataUrl: string,
  columnLabel?: string
): Promise<string | null> {
  try {
    const response = await fetch('/api/ink/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageDataUrl,
        columnLabel,
      }),
    });

    if (!response.ok) {
      console.error('Recognition API returned non-OK status:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('Recognition API returned error:', data.error);
      return null;
    }

    return data.text ?? null;
  } catch (error) {
    console.error('Failed to call recognition API:', error);
    return null;
  }
}
