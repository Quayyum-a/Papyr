/**
 * Ink Recognition Utilities
 * 
 * Functions for capturing cell ink as images and recognizing handwritten text
 * via OpenRouter vision models.
 */

import { getCellBounds, getExpandedCellBounds, type LedgerConfig, type CellCoordinates } from '@/types/ledger';
import type { Stroke } from './ink-engine/types';

/**
 * Captures the ink within a specific cell as a base64 PNG data URL
 * Uses expanded cell bounds to capture the full active writing zone
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
  // Use expanded bounds for active cells to capture the full writing zone
  const bounds = getExpandedCellBounds(ledgerConfig, cellCoords.columnIndex, cellCoords.rowIndex);
  
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
 * Tries Google Cloud Vision first (more accurate, cheaper), falls back to OpenRouter
 * 
 * @param imageDataUrl - Base64 PNG data URL of the cell image
 * @param columnLabel - Optional column label for context-aware recognition
 * @returns Recognized text, or null if all recognition attempts fail
 */
export async function recognizeInk(
  imageDataUrl: string,
  columnLabel?: string
): Promise<string | null> {
  // Try Google Cloud Vision first (primary method)
  try {
    const visionResponse = await fetch('/api/ink/recognize-vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageDataUrl,
        columnLabel,
      }),
    });

    if (visionResponse.ok) {
      const visionData = await visionResponse.json();
      
      if (!visionData.error && visionData.text !== undefined) {
        console.log('[Recognition] Google Cloud Vision succeeded:', {
          text: visionData.text,
          confidence: visionData.confidence,
        });
        return visionData.text;
      }
    } else if (visionResponse.status === 503) {
      // Service not configured, fall through to OpenRouter
      console.log('[Recognition] Google Cloud Vision not configured, trying OpenRouter');
    } else {
      console.warn('[Recognition] Google Cloud Vision failed:', visionResponse.status);
    }
  } catch (error) {
    console.warn('[Recognition] Google Cloud Vision error:', error);
  }

  // Fallback to OpenRouter (secondary method)
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
