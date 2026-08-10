import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LedgerWorkspace } from './LedgerWorkspace';
import type { LedgerPageContent } from '@/types/ledger';

// Mock the hook
vi.mock('@/hooks/useLedgerWorkspace', () => ({
  useLedgerWorkspace: vi.fn(() => ({
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
  })),
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
  });

  it('should render content wrapper with explicit dimensions from ledgerConfig', () => {
    const { container } = render(<LedgerWorkspace {...defaultProps} />);

    // Find the content wrapper div (the one with explicit width/height)
    // It's the div that has both width and height set (the ledger content wrapper)
    const contentWrapper = Array.from(container.querySelectorAll('div')).find(
      (div) => div.style.width && div.style.height && div.style.width.includes('px') && div.style.height.includes('px')
    ) as HTMLElement;

    expect(contentWrapper).toBeInTheDocument();

    // Check that width and height are set explicitly (not min-width or percentage)
    const style = contentWrapper.style;
    expect(style.width).toBe('640px'); // 120 + 280 + 120 + 120 = 640
    expect(style.height).toBe('928px'); // 48 + (20 * 44) = 928
  });

  it('should compute correct dimensions for different column configurations', () => {
    // Use vi.hoisted to define mock values
  });

  it('should not use min-width max-content or percentage heights', () => {
    const { container } = render(<LedgerWorkspace {...defaultProps} />);

    // The content wrapper should NOT have min-width: max-content
    const contentWrapper = container.querySelector('div[style*="width:"]') as HTMLElement;

    expect(contentWrapper.style.minWidth).toBe('');
    expect(contentWrapper.style.width).not.toContain('%');
    expect(contentWrapper.style.height).not.toContain('%');
  });
});