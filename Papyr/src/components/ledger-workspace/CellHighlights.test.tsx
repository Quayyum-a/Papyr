import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CellHighlights } from './CellHighlights';
import type { LedgerConfig, CellCoordinates } from '@/types/ledger';

describe('CellHighlights', () => {
  const mockLedgerConfig: LedgerConfig = {
    columns: [
      { id: '1', label: 'Date', width: 120, position: 0 },
      { id: '2', label: 'Description', width: 280, position: 1 },
    ],
    rowCount: 5,
  };

  it('should render correct number of cells', () => {
    const handleCellSelect = vi.fn();
    const { container } = render(
      <CellHighlights
        ledgerConfig={mockLedgerConfig}
        selectedCell={null}
        onCellSelect={handleCellSelect}
      />
    );

    // Should render 2 columns * 5 rows = 10 cells
    const cells = container.querySelectorAll('[role="button"]');
    expect(cells).toHaveLength(10);
  });

  it('should call onCellSelect when cell is clicked', () => {
    const handleCellSelect = vi.fn();
    const { container } = render(
      <CellHighlights
        ledgerConfig={mockLedgerConfig}
        selectedCell={null}
        onCellSelect={handleCellSelect}
      />
    );

    const firstCell = container.querySelector('[role="button"]') as HTMLElement;
    fireEvent.click(firstCell);

    expect(handleCellSelect).toHaveBeenCalledWith({ columnIndex: 0, rowIndex: 0 });
  });

  it('should toggle selection when clicking same cell', () => {
    const handleCellSelect = vi.fn();
    const selectedCell: CellCoordinates = { columnIndex: 0, rowIndex: 0 };
    
    const { container } = render(
      <CellHighlights
        ledgerConfig={mockLedgerConfig}
        selectedCell={selectedCell}
        onCellSelect={handleCellSelect}
      />
    );

    const firstCell = container.querySelector('[role="button"]') as HTMLElement;
    fireEvent.click(firstCell);

    expect(handleCellSelect).toHaveBeenCalledWith(null);
  });

  it('should highlight selected cell', () => {
    const handleCellSelect = vi.fn();
    const selectedCell: CellCoordinates = { columnIndex: 1, rowIndex: 2 };
    
    const { container } = render(
      <CellHighlights
        ledgerConfig={mockLedgerConfig}
        selectedCell={selectedCell}
        onCellSelect={handleCellSelect}
      />
    );

    const cells = container.querySelectorAll('[role="button"]');
    // Row 2, Column 1: (2 rows * 2 columns per row) + column 1 = cell 5
    const selectedCellElement = cells[5];

    expect(selectedCellElement).toHaveClass('bg-yellow-50');
  });

  it('should clear selection when clicking background', () => {
    const handleCellSelect = vi.fn();
    const selectedCell: CellCoordinates = { columnIndex: 0, rowIndex: 0 };
    
    const { container } = render(
      <CellHighlights
        ledgerConfig={mockLedgerConfig}
        selectedCell={selectedCell}
        onCellSelect={handleCellSelect}
      />
    );

    const background = container.firstChild as HTMLElement;
    fireEvent.click(background);

    expect(handleCellSelect).toHaveBeenCalledWith(null);
  });

  it('should support keyboard navigation', () => {
    const handleCellSelect = vi.fn();
    const { container } = render(
      <CellHighlights
        ledgerConfig={mockLedgerConfig}
        selectedCell={null}
        onCellSelect={handleCellSelect}
      />
    );

    const firstCell = container.querySelector('[role="button"]') as HTMLElement;
    
    // Test Enter key
    fireEvent.keyDown(firstCell, { key: 'Enter' });
    expect(handleCellSelect).toHaveBeenCalledWith({ columnIndex: 0, rowIndex: 0 });

    // Test Space key
    fireEvent.keyDown(firstCell, { key: ' ' });
    expect(handleCellSelect).toHaveBeenCalledTimes(2);
  });

  it('should have correct ARIA labels', () => {
    const handleCellSelect = vi.fn();
    render(
      <CellHighlights
        ledgerConfig={mockLedgerConfig}
        selectedCell={null}
        onCellSelect={handleCellSelect}
      />
    );

    expect(screen.getByLabelText('Cell Date row 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Cell Description row 1')).toBeInTheDocument();
  });
});
