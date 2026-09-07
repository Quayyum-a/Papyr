/**
 * Ledger Workspace Type Definitions
 * 
 * Defines the data structures for the ledger workspace feature,
 * including columns, cells, and cell-bound ink strokes.
 */

/**
 * Column type for special behavior (e.g., date picker)
 */
export type LedgerColumnType = 'text' | 'number' | 'date';

/**
 * Represents a single column in the ledger
 */
export interface LedgerColumn {
  /** Unique identifier for the column */
  id: string;

  /** Display label for the column header */
  label: string;

  /** Width of the column in pixels */
  width: number;

  /** Position index of the column (0-based, left to right) */
  position: number;

  /** Column type for special behavior (default: 'text') */
  type?: LedgerColumnType;
}

/**
 * Configuration for the entire ledger grid on a page
 */
export interface LedgerConfig {
  /** Array of column definitions */
  columns: LedgerColumn[];
  
  /** Number of rows to display in the ledger */
  rowCount: number;
}

/**
 * Coordinates identifying a specific cell in the ledger grid
 */
export interface CellCoordinates {
  /** Column index (0-based) */
  columnIndex: number;
  
  /** Row index (0-based) */
  rowIndex: number;
}

/**
 * Cell data for a single cell in the ledger
 */
export interface LedgerCellData {
  /** Cell identifier (format: "col-{columnIndex}-row-{rowIndex}") */
  cellId: string;

  /** Display value for the cell (recognized text or typed text) */
  value: string;

  /** Type of content in the cell */
  content_type: 'empty' | 'text' | 'number' | 'ink';

  /** MyScript recognition candidate alternatives (for predictive suggestions) */
  candidates?: string[];
}

/**
 * Complete page content structure for ledger pages
 * Stored in pages.content JSONB field in database
 */
export interface LedgerPageContent {
  /** Array of ink strokes, some may be bound to cells */
  strokes: StrokeWithCell[];
  
  /** Ledger grid configuration */
  ledger: LedgerConfig;
  
  /** Cell data (recognized text, typed values, etc.) - keyed by cellId */
  cells?: Record<string, LedgerCellData>;
}

/**
 * Extended stroke interface that includes optional cell binding
 * This extends the base Stroke type from ink-engine
 */
export interface StrokeWithCell {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  size: 'extra-fine' | 'fine' | 'medium' | 'bold' | 'marker';
  segments: any[]; // StrokeSegment[] - avoid circular dependency
  createdAt: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  
  /** 
   * Cell ID this stroke is bound to
   * Format: "col-{columnIndex}-row-{rowIndex}"
   * null or undefined = free ink (not bound to any cell)
   */
  cell_id?: string | null;
}

/**
 * Helper to generate cell ID from coordinates
 */
export function getCellId(coords: CellCoordinates): string {
  return `col-${coords.columnIndex}-row-${coords.rowIndex}`;
}

/**
 * Helper to parse cell ID back into coordinates
 * Returns null if cell_id is invalid or null
 */
export function parseCellId(cell_id: string | null | undefined): CellCoordinates | null {
  if (!cell_id) return null;
  
  const match = cell_id.match(/^col-(\d+)-row-(\d+)$/);
  if (!match) return null;
  
  return {
    columnIndex: parseInt(match[1], 10),
    rowIndex: parseInt(match[2], 10),
  };
}

/**
 * Default ledger configuration (4 columns: Date, Description, Debit, Credit)
 */
export const DEFAULT_LEDGER_CONFIG: Omit<LedgerConfig, 'columns'> & {
  columns: Omit<LedgerColumn, 'id'>[]
} = {
  columns: [
    { label: 'Date', width: 120, position: 0, type: 'date' },
    { label: 'Description', width: 280, position: 1, type: 'text' },
    { label: 'Debit', width: 120, position: 2, type: 'number' },
    { label: 'Credit', width: 120, position: 3, type: 'number' },
  ],
  rowCount: 20,
};

/**
 * Constants for ledger rendering
 */
export const LEDGER_CONSTANTS = {
  /** Height of each row in pixels */
  ROW_HEIGHT: 44,
  
  /** Minimum column width in pixels */
  MIN_COLUMN_WIDTH: 80,
  
  /** Maximum column width in pixels */
  MAX_COLUMN_WIDTH: 400,
  
  /** Height of column headers in pixels */
  HEADER_HEIGHT: 48,
  
  /** Color for cell highlight (pale yellow) */
  CELL_HIGHLIGHT_COLOR: '#FFFBEA',
  
  /** Opacity for cell highlight */
  CELL_HIGHLIGHT_OPACITY: 0.5,
  
  /** Paper background color (warm off-white) */
  PAPER_COLOR: '#F8F6EE',
  
  /** Horizontal row line color */
  ROW_LINE_COLOR: '#E5E5E5',
  
  /** Vertical column divider color */
  COLUMN_LINE_COLOR: '#D8D2C2',
  
  /** Tap-and-hold duration for edit (milliseconds) */
  TAP_HOLD_DURATION: 500,
} as const;

// Backward compatibility exports (for existing files)
export const MIN_COLUMN_WIDTH = LEDGER_CONSTANTS.MIN_COLUMN_WIDTH;
export const MAX_COLUMN_WIDTH = LEDGER_CONSTANTS.MAX_COLUMN_WIDTH;
export const DEFAULT_ROW_COUNT = DEFAULT_LEDGER_CONFIG.rowCount;
export const DEFAULT_COLUMNS = DEFAULT_LEDGER_CONFIG.columns;

/**
 * Legacy types for old table-based ledger (backward compatibility)
 * These are used by the old book detail page
 */
export interface LedgerCell {
  id: string;
  row_id: string;
  column_id: string;
  content: string;
  content_type: 'empty' | 'text' | 'number' | 'ink';
  value?: string; // Optional for backward compatibility
}

export interface LedgerRow {
  id: string;
  position?: number; // Optional for backward compatibility
  cells: LedgerCell[];
}

/**
 * Create default ledger page content
 * Used when creating a new page for a book
 * Date columns are rendered with live "today" default in CellContent.tsx
 * (no pre-filled stored values to avoid staleness)
 */
export function createDefaultLedgerPageContent(): LedgerPageContent {
  const columns = DEFAULT_LEDGER_CONFIG.columns.map((col, idx) => ({
    ...col,
    id: `col-${idx}`,
  }));

  return {
    strokes: [],
    ledger: {
      columns,
      rowCount: DEFAULT_LEDGER_CONFIG.rowCount,
    },
    cells: {},
  };
}

/**
 * Compute the bounding box of a cell in canvas coordinates
 * @param ledgerConfig - The ledger configuration with columns
 * @param columnIndex - Column index (0-based)
 * @param rowIndex - Row index (0-based)
 * @returns Object with x, y, width, height in canvas coordinates
 */
export function getCellBounds(
  ledgerConfig: LedgerConfig,
  columnIndex: number,
  rowIndex: number
): { x: number; y: number; width: number; height: number } | null {
  const sortedColumns = [...ledgerConfig.columns].sort((a, b) => a.position - b.position);

  if (columnIndex < 0 || columnIndex >= sortedColumns.length) {
    return null;
  }

  if (rowIndex < 0 || rowIndex >= ledgerConfig.rowCount) {
    return null;
  }

  // Compute x offset by summing widths of preceding columns
  let x = 0;
  for (let i = 0; i < columnIndex; i++) {
    x += sortedColumns[i].width;
  }

  const column = sortedColumns[columnIndex];
  const y = LEDGER_CONSTANTS.HEADER_HEIGHT + rowIndex * LEDGER_CONSTANTS.ROW_HEIGHT;

  return {
    x,
    y,
    width: column.width,
    height: LEDGER_CONSTANTS.ROW_HEIGHT,
  };
}

/**
 * Constants for expanded cell bounds (active cell writing zone)
 */
export const EXPANDED_CELL_CONSTANTS = {
  /** Minimum comfortable width for natural handwriting (pixels) */
  MIN_WRITING_WIDTH: 200,
  
  /** Vertical expansion above cell (half row height) */
  VERTICAL_EXPANSION_ABOVE: LEDGER_CONSTANTS.ROW_HEIGHT / 2,
  
  /** Vertical expansion below cell (half row height) */
  VERTICAL_EXPANSION_BELOW: LEDGER_CONSTANTS.ROW_HEIGHT / 2,
  
  /** Background tint color for expanded zone */
  EXPANDED_ZONE_COLOR: '#FFF4CC',
  
  /** Opacity for expanded zone background */
  EXPANDED_ZONE_OPACITY: 0.3,
} as const;

/**
 * Compute expanded bounds for an active cell's writing zone
 * Provides more room for natural handwriting: extends vertically and ensures minimum width
 *
 * @param ledgerConfig - The ledger configuration with columns
 * @param columnIndex - Column index (0-based)
 * @param rowIndex - Row index (0-based)
 * @returns Expanded bounds object, or null if cell is invalid
 */
export function getExpandedCellBounds(
  ledgerConfig: LedgerConfig,
  columnIndex: number,
  rowIndex: number
): { x: number; y: number; width: number; height: number } | null {
  const baseBounds = getCellBounds(ledgerConfig, columnIndex, rowIndex);

  if (!baseBounds) {
    return null;
  }

  // Expand vertically (half row height above and below)
  const expandedHeight =
    baseBounds.height +
    EXPANDED_CELL_CONSTANTS.VERTICAL_EXPANSION_ABOVE +
    EXPANDED_CELL_CONSTANTS.VERTICAL_EXPANSION_BELOW;

  const expandedY = baseBounds.y - EXPANDED_CELL_CONSTANTS.VERTICAL_EXPANSION_ABOVE;

  // Ensure minimum comfortable width for writing
  let expandedWidth = baseBounds.width;
  let expandedX = baseBounds.x;

  if (baseBounds.width < EXPANDED_CELL_CONSTANTS.MIN_WRITING_WIDTH) {
    // Expand horizontally, centered on the cell
    const widthDiff = EXPANDED_CELL_CONSTANTS.MIN_WRITING_WIDTH - baseBounds.width;
    expandedWidth = EXPANDED_CELL_CONSTANTS.MIN_WRITING_WIDTH;
    expandedX = baseBounds.x - widthDiff / 2;
  }

  return {
    x: expandedX,
    y: expandedY,
    width: expandedWidth,
    height: expandedHeight,
  };
}

/**
 * Get effective column widths for the current viewport
 * Single source of truth for column widths used by both CSS grid and canvas drawing
 *
 * @param ledgerConfig - The ledger configuration with columns
 * @param isMobile - Whether the viewport is mobile (< 768px)
 * @returns Array of column widths in pixels, in position order
 */
export function getEffectiveColumnWidths(
  ledgerConfig: LedgerConfig,
  isMobile: boolean
): number[] {
  const sortedColumns = [...ledgerConfig.columns].sort((a, b) => a.position - b.position);

  if (!isMobile) {
    // Desktop: use configured widths
    return sortedColumns.map(col => col.width);
  }

  // Mobile: Date column (first, position 0) frozen at 80px, others at 120px
  return sortedColumns.map((col, index) => {
    if (index === 0 && col.type === 'date') {
      return 80; // Frozen narrow date column
    }
    return 120; // Other columns scrollable at 120px
  });
}

/**
 * Compute the total content dimensions of the ledger
 * This gives the exact size the ledger content should be, derived entirely from config
 *
 * @param ledgerConfig - The ledger configuration with columns and row count
 * @param isMobile - Whether the viewport is mobile (affects column widths)
 * @returns Object with total width and height in pixels
 */
export function getLedgerContentDimensions(
  ledgerConfig: LedgerConfig,
  isMobile: boolean = false
): { width: number; height: number } {
  // Total width = sum of effective column widths
  const totalWidth = getEffectiveColumnWidths(ledgerConfig, isMobile).reduce((sum, w) => sum + w, 0);

  // Total height = header height + (row count * row height)
  const totalHeight = LEDGER_CONSTANTS.HEADER_HEIGHT + ledgerConfig.rowCount * LEDGER_CONSTANTS.ROW_HEIGHT;

  return { width: totalWidth, height: totalHeight };
}
