/**
 * Ledger Workspace Type Definitions
 * 
 * Defines the data structures for the ledger workspace feature,
 * including columns, cells, and cell-bound ink strokes.
 */

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
 * Complete page content structure for ledger pages
 * Stored in pages.content JSONB field in database
 */
export interface LedgerPageContent {
  /** Array of ink strokes, some may be bound to cells */
  strokes: StrokeWithCell[];
  
  /** Ledger grid configuration */
  ledger: LedgerConfig;
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
    { label: 'Date', width: 120, position: 0 },
    { label: 'Description', width: 280, position: 1 },
    { label: 'Debit', width: 120, position: 2 },
    { label: 'Credit', width: 120, position: 3 },
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
  content_type: 'empty' | 'text' | 'number';
  value?: string; // Optional for backward compatibility
}

export interface LedgerRow {
  id: string;
  position?: number; // Optional for backward compatibility
  cells: LedgerCell[];
}
