import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { LedgerWorkspace } from './LedgerWorkspace';
import type { LedgerPageContent } from '@/types/ledger';

// Mock useLedgerWorkspace hook
const mockUseLedgerWorkspace = {
  strokes: [],
  currentPoints: null,
  currentPenSize: 'medium',
  currentColor: '#000000',
  setPenSize: vi.fn(),
  setPenColor: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: false,
  canRedo: false,
  selectedCell: null,
  selectedCellId: null,
  selectCell: vi.fn(),
  clearSelection: vi.fn(),
  ledgerConfig: {
    columns: [
      { id: '1', label: 'Date', width: 120, position: 0 },
      { id: '2', label: 'Description', width: 280, position: 1 },
      { id: '3', label: 'Debit', width: 120, position: 2 },
      { id: '4', label: 'Credit', width: 120, position: 3 },
    ],
    rowCount: 20,
  },
  addColumn: vi.fn(),
  editColumn: vi.fn(),
  removeColumn: vi.fn(),
  setLedgerConfig: vi.fn(),
  isDrawing: false,
  isSaving: false,
  recognizingCells: new Set(),
  inkCanvasRef: { current: null },
  handlePointerDown: vi.fn(),
  handlePointerMove: vi.fn(),
  handlePointerUp: vi.fn(),
  handlePointerLeave: vi.fn(),
};

vi.mock('@/hooks/useLedgerWorkspace', () => ({
  useLedgerWorkspace: vi.fn(() => mockUseLedgerWorkspace),
}));

// Mock supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('LedgerWorkspace', () => {
  const defaultProps = {
    bookId: 'test-book-id',
    pageId: 'test-page-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to default values
    mockUseLedgerWorkspace.strokes = [];
    mockUseLedgerWorkspace.currentPoints = null;
    mockUseLedgerWorkspace.currentPenSize = 'medium';
    mockUseLedgerWorkspace.currentColor = '#000000';
    mockUseLedgerWorkspace.selectedCell = null;
    mockUseLedgerWorkspace.selectedCellId = null;
    mockUseLedgerWorkspace.ledgerConfig = {
      columns: [
        { id: '1', label: 'Date', width: 120, position: 0 },
        { id: '2', label: 'Description', width: 280, position: 1 },
        { id: '3', label: 'Debit', width: 120, position: 2 },
        { id: '4', label: 'Credit', width: 120, position: 3 },
      ],
      rowCount: 20,
    };
  });

  it('should render content wrapper with min-width 100% and width max-content from ledgerConfig', () => {
    const { container } = render(<LedgerWorkspace {...defaultProps} />);

    // Find the content wrapper div (the one with min-width and width set)
    const contentWrapper = Array.from(container.querySelectorAll('div')).find(
      (div) => div.style.minWidth && div.style.width && div.style.height &&
               div.style.minWidth === '100%' && div.style.width === 'max-content' && div.style.height.endsWith('px')
    ) as HTMLElement;

    expect(contentWrapper).toBeInTheDocument();

    // Check that min-width is 100% and width is max-content
    expect(contentWrapper.style.minWidth).toBe('100%');
    expect(contentWrapper.style.width).toBe('max-content');

    // Check that height is set explicitly (not min-height or percentage)
    const style = contentWrapper.style;
    expect(style.height).toBe('928px'); // 48 + (20 * 44) = 928
    expect(style.minHeight).toBe('');
    expect(style.height).not.toContain('%');
  });

  it('should compute correct dimensions for different column configurations', () => {
    // Update mock with different ledger config
    mockUseLedgerWorkspace.ledgerConfig = {
      columns: [
        { id: '1', label: 'A', width: 100, position: 0 },
        { id: '2', label: 'B', width: 200, position: 1 },
      ],
      rowCount: 10,
    };

    const { container } = render(<LedgerWorkspace {...defaultProps} />);

    // Find the content wrapper div (the one with min-width and width set)
    const contentWrapper = Array.from(container.querySelectorAll('div')).find(
      (div) => div.style.minWidth && div.style.width && div.style.height &&
               div.style.minWidth === '100%' && div.style.width === 'max-content' && div.style.height.endsWith('px')
    ) as HTMLElement;

    expect(contentWrapper).toBeInTheDocument();

    // Check that min-width is 100% and width is max-content
    expect(contentWrapper.style.minWidth).toBe('100%');
    expect(contentWrapper.style.width).toBe('max-content');

    // Check that height is set explicitly (not min-height or percentage)
    const style = contentWrapper.style;
    expect(style.height).toBe('488px'); // 48 + (10 * 44) = 488
    expect(style.minHeight).toBe('');
    expect(style.height).not.toContain('%');
  });
});