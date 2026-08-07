/**
 * Ledger Workspace Components
 * 
 * Three-layer canvas system for the digital ledger:
 * - Paper layer: Realistic paper texture and background
 * - Grid layer: Row and column lines
 * - Ink layer: Handwritten strokes using premium ink engine
 * - Overlay layer: Column headers and cell selection
 */

export { LedgerCanvas } from './LedgerCanvas';
export { PaperLayer } from './PaperLayer';
export { GridLayer } from './GridLayer';
export { InkLayer } from './InkLayer';
export { ColumnHeaders } from './ColumnHeaders';
export { CellHighlights } from './CellHighlights';

export { useLedgerCanvas } from './useLedgerCanvas';
export { useCellSelection } from './useCellSelection';
export { useLedgerConfig } from './useLedgerConfig';
