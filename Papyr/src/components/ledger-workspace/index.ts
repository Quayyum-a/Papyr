/**
 * Ledger Workspace Components
 *
 * Four-layer canvas system for the digital ledger:
 * - Paper layer: Realistic paper texture and background
 * - Grid layer: Row and column lines
 * - Selection layer: Subtle cell selection highlight (canvas, below ink)
 * - Ink layer: Handwritten strokes using premium ink engine
 * - Overlay layer: Column headers, cell selection, and calendar picker
 */

export { LedgerCanvas } from './LedgerCanvas';
export { PaperLayer } from './PaperLayer';
export { GridLayer } from './GridLayer';
export { SelectionLayer } from './SelectionLayer';
export { InkLayer } from './InkLayer';
export { ColumnHeaders } from './ColumnHeaders';
export { CellHighlights } from './CellHighlights';
export { LedgerWorkspace } from './LedgerWorkspace';

export { useLedgerCanvas } from './useLedgerCanvas';
export { useCellSelection } from './useCellSelection';
export { useLedgerConfig } from './useLedgerConfig';
export { useLedgerWorkspace } from '@/hooks/useLedgerWorkspace';
