import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CellContent } from './CellContent';
import type { LedgerConfig, LedgerCellData } from '@/types/ledger';

// Mock date for consistent testing
const mockDate = new Date('2026-08-19T12:00:00.000Z');
const emptyCells: Record<string, LedgerCellData> = {};

describe('CellContent', () => {
  const mockLedgerConfig: LedgerConfig = {
    columns: [
      { id: 'col-0', label: 'Date', width: 120, position: 0, type: 'date' },
      { id: 'col-1', label: 'Description', width: 280, position: 1, type: 'text' },
      { id: 'col-2', label: 'Debit', width: 120, position: 2, type: 'number' },
      { id: 'col-3', label: 'Credit', width: 120, position: 3, type: 'number' },
    ],
    rowCount: 20,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Date column rendering', () => {
    it('should render live "today" date for date column cells with no stored value', () => {
      const { container } = render(
        <CellContent
          ledgerConfig={mockLedgerConfig}
          cells={emptyCells}
          selectedCell={null}
          recognizingCells={new Set()}
        />
      );

      // Should find "Aug 19, 2026" in the first column (Date) for row 0
      const dateCells = container.querySelectorAll('.text-gray-900');
      expect(dateCells.length).toBeGreaterThan(0);

      // Check first row, first column (date column) has today's date
      const firstDateCell = dateCells[0];
      expect(firstDateCell.textContent).toBe('Aug 19, 2026');
    });

    it('should render live "today" date for all rows in date column when no cells stored', () => {
      const { container } = render(
        <CellContent
          ledgerConfig={mockLedgerConfig}
          cells={emptyCells}
          selectedCell={null}
          recognizingCells={new Set()}
        />
      );

      // Should have today's date for each row in the date column (20 rows)
      const dateSpans = container.querySelectorAll('span.text-gray-900');
      const dateValues = Array.from(dateSpans).map(span => span.textContent);

      // Filter to only date column values (first column of each row)
      // There are 4 columns per row, 20 rows = 80 cells, but only date column has values
      expect(dateValues.filter(v => v === 'Aug 19, 2026').length).toBe(20);
    });

    it('should NOT render live date for non-date columns with no stored value', () => {
      const { container } = render(
        <CellContent
          ledgerConfig={mockLedgerConfig}
          cells={emptyCells}
          selectedCell={null}
          recognizingCells={new Set()}
        />
      );

      // Description, Debit, Credit columns should be empty
      const textSpans = container.querySelectorAll('span.text-gray-900');
      const nonDateValues = Array.from(textSpans).filter(span => span.textContent !== 'Aug 19, 2026');
      expect(nonDateValues.length).toBe(0);
    });

    it('should render stored value over live date default when cell has stored data', () => {
      const cells: Record<string, LedgerCellData> = {
        'col-0-row-0': {
          cellId: 'col-0-row-0',
          value: 'Custom Date',
          content_type: 'text',
        },
      };

      const { container } = render(
        <CellContent
          ledgerConfig={mockLedgerConfig}
          cells={cells}
          selectedCell={null}
          recognizingCells={new Set()}
        />
      );

      const textSpans = container.querySelectorAll('span.text-gray-900');
      const values = Array.from(textSpans).map(span => span.textContent);

      // First cell should show stored value, not live date
      expect(values[0]).toBe('Custom Date');
      // Other date column cells should still show live date
      expect(values.filter(v => v === 'Aug 19, 2026').length).toBe(19);
    });

    it('should render live date when cell exists but has empty value', () => {
      const cells: Record<string, LedgerCellData> = {
        'col-0-row-0': {
          cellId: 'col-0-row-0',
          value: '',
          content_type: 'text',
        },
      };

      const { container } = render(
        <CellContent
          ledgerConfig={mockLedgerConfig}
          cells={cells}
          selectedCell={null}
          recognizingCells={new Set()}
        />
      );

      const textSpans = container.querySelectorAll('span.text-gray-900');
      const values = Array.from(textSpans).map(span => span.textContent);

      // First cell should show live date since value is empty
      expect(values[0]).toBe('Aug 19, 2026');
    });
  });

  describe('Text column rendering', () => {
    it('should render stored text value', () => {
      const cells: Record<string, LedgerCellData> = {
        'col-1-row-0': {
          cellId: 'col-1-row-0',
          value: 'Test Description',
          content_type: 'text',
        },
      };

      const { container } = render(
        <CellContent
          ledgerConfig={mockLedgerConfig}
          cells={cells}
          selectedCell={null}
          recognizingCells={new Set()}
        />
      );

      const textSpans = container.querySelectorAll('span.text-gray-900');
      const values = Array.from(textSpans).map(span => span.textContent);
      expect(values).toContain('Test Description');
    });

    it('should not render anything for empty text column cells', () => {
      const { container } = render(
        <CellContent
          ledgerConfig={mockLedgerConfig}
          cells={emptyCells}
          selectedCell={null}
          recognizingCells={new Set()}
        />
      );

      // Description column (col-1) should have no text content
      const textSpans = container.querySelectorAll('span.text-gray-900');
      const nonDateValues = Array.from(textSpans).filter(span => span.textContent !== 'Aug 19, 2026');
      expect(nonDateValues.length).toBe(0);
    });
  });

  describe('Ink indicator rendering', () => {
    it('should render ink indicator for failed recognition', () => {
      const cells: Record<string, LedgerCellData> = {
        'col-1-row-0': {
          cellId: 'col-1-row-0',
          value: '',
          content_type: 'ink',
        },
      };

      const { container } = render(
        <CellContent
          ledgerConfig={mockLedgerConfig}
          cells={cells}
          selectedCell={null}
          recognizingCells={new Set()}
        />
      );

      // Should have "retry" text for ink indicator
      const retryText = container.querySelector('span[aria-label="Unrecognized handwriting"]');
      expect(retryText).toBeInTheDocument();
      expect(retryText?.textContent).toBe('retry');
    });
  });

  describe('Selected/recognizing cells', () => {
    it('should not render content for selected cell', () => {
      const cells: Record<string, LedgerCellData> = {
        'col-0-row-0': {
          cellId: 'col-0-row-0',
          value: 'Stored Date',
          content_type: 'text',
        },
      };

      const { container } = render(
        <CellContent
          ledgerConfig={mockLedgerConfig}
          cells={cells}
          selectedCell={{ columnIndex: 0, rowIndex: 0 }}
          recognizingCells={new Set()}
        />
      );

      // Selected cell should be empty (raw ink shown on canvas instead)
      const textSpans = container.querySelectorAll('span.text-gray-900');
      const values = Array.from(textSpans).map(span => span.textContent);
      expect(values).not.toContain('Stored Date');
      // Other date cells should still show live date
      expect(values.filter(v => v === 'Aug 19, 2026').length).toBe(19);
    });

    it('should not render content for recognizing cell', () => {
      const cells: Record<string, LedgerCellData> = {
        'col-0-row-0': {
          cellId: 'col-0-row-0',
          value: 'Stored Date',
          content_type: 'text',
        },
      };

      const { container } = render(
        <CellContent
          ledgerConfig={mockLedgerConfig}
          cells={cells}
          selectedCell={null}
          recognizingCells={new Set(['col-0-row-0'])}
        />
      );

      // Recognizing cell should be empty
      const textSpans = container.querySelectorAll('span.text-gray-900');
      const values = Array.from(textSpans).map(span => span.textContent);
      expect(values).not.toContain('Stored Date');
      expect(values.filter(v => v === 'Aug 19, 2026').length).toBe(19);
    });
  });
});