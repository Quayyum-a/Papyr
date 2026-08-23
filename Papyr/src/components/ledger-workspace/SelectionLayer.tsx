'use client';

import { useEffect } from 'react';
import { LEDGER_CONSTANTS, type LedgerConfig, type CellCoordinates, getCellBounds } from '@/types/ledger';

interface SelectionLayerProps {
  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  ledgerConfig: LedgerConfig;
  selectedCell: CellCoordinates | null;
}

/**
 * Renders the cell selection highlight on a canvas layer BELOW the ink layer
 * This ensures handwriting always remains visually primary and is never covered by selection UI
 * Uses a warm, neutral translucent treatment consistent with the Papyr design language
 * Reduced opacity to prevent overshadowing handwriting strokes
 */
export function SelectionLayer({ ctx, width, height, ledgerConfig, selectedCell }: SelectionLayerProps) {
  useEffect(() => {
    if (!ctx || width === 0 || height === 0 || !selectedCell) {
      // Clear canvas if no selection
      if (ctx) ctx.clearRect(0, 0, width, height);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get cell bounds
    const bounds = getCellBounds(ledgerConfig, selectedCell.columnIndex, selectedCell.rowIndex);
    if (!bounds) return;

    const { x, y, width: cellWidth, height: cellHeight } = bounds;

    // Use much lighter fill (10% opacity) to avoid overshadowing handwriting
    // The border provides clear visual indication without heavy fill
    const highlightColor = LEDGER_CONSTANTS.CELL_HIGHLIGHT_COLOR;
    const highlightOpacity = 0.1; // Reduced from 0.5 to 0.1

    // Draw very subtle background fill
    ctx.fillStyle = `${highlightColor}${Math.round(highlightOpacity * 255).toString(16).padStart(2, '0')}`;
    ctx.fillRect(x, y, cellWidth, cellHeight);

    // Draw thin warm border for clear identification
    // Using a slightly darker amber for the border
    ctx.strokeStyle = '#F59E0B'; // Amber-500
    ctx.lineWidth = 1.5; // Slightly thicker for better visibility

    // Use dashed line for organic feel if supported (not available in test mocks)
    if (typeof ctx.setLineDash === 'function') {
      ctx.setLineDash([3, 3]);
      ctx.lineDashOffset = 0;
    }

    // Inset the border slightly to avoid overlapping grid lines
    const inset = 0.5;
    ctx.strokeRect(
      x + inset,
      y + inset,
      cellWidth - inset * 2,
      cellHeight - inset * 2
    );

    // Reset line dash if supported
    if (typeof ctx.setLineDash === 'function') {
      ctx.setLineDash([]);
    }
  }, [ctx, width, height, ledgerConfig, selectedCell]);

  return null; // This component only renders to canvas, no DOM output
}