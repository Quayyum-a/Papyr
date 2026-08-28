import { useEffect } from 'react';
import { LEDGER_CONSTANTS, type LedgerConfig } from '@/types/ledger';

interface GridLayerProps {
  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  ledgerConfig: LedgerConfig;
}

/**
 * Renders the ledger grid lines (rows and columns)
 * Creates the traditional ledger book appearance
 */
export function GridLayer({ ctx, width, height, ledgerConfig }: GridLayerProps) {
  useEffect(() => {
    console.log('GridLayer render:', { ctx: !!ctx, width, height, columns: ledgerConfig.columns.length });
    if (!ctx || width === 0 || height === 0) {
      console.warn('GridLayer: Invalid context or dimensions');
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw horizontal row lines
    drawRowLines(ctx, width, height, ledgerConfig.rowCount);

    // Draw vertical column dividers
    drawColumnLines(ctx, height, ledgerConfig);
    
    console.log('GridLayer: Rendered successfully');
  }, [ctx, width, height, ledgerConfig]);

  return null; // This component only renders to canvas, no DOM output
}

/**
 * Draw horizontal lines for each row
 */
function drawRowLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rowCount: number
) {
  ctx.strokeStyle = LEDGER_CONSTANTS.ROW_LINE_COLOR;
  ctx.lineWidth = 1;

  const rowHeight = LEDGER_CONSTANTS.ROW_HEIGHT;
  const headerHeight = LEDGER_CONSTANTS.HEADER_HEIGHT;

  // Start below the header
  const startY = headerHeight;

  for (let i = 0; i <= rowCount; i++) {
    const y = startY + i * rowHeight;
    
    // Only draw if within canvas bounds
    if (y > height) break;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

/**
 * Draw vertical lines for column dividers
 */
function drawColumnLines(
  ctx: CanvasRenderingContext2D,
  height: number,
  ledgerConfig: LedgerConfig
) {
  ctx.strokeStyle = LEDGER_CONSTANTS.COLUMN_LINE_COLOR;
  ctx.lineWidth = 1;

  let xOffset = 0;

  // Sort columns by position to ensure correct order
  const sortedColumns = [...ledgerConfig.columns].sort(
    (a, b) => a.position - b.position
  );

  // Draw vertical line after each column
  for (const column of sortedColumns) {
    xOffset += column.width;

    ctx.beginPath();
    ctx.moveTo(xOffset, 0);
    ctx.lineTo(xOffset, height);
    ctx.stroke();
  }
}
