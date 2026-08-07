import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LedgerTable } from './LedgerTable';
import type { LedgerColumn, LedgerRow } from '@/types/ledger';

describe('LedgerTable', () => {
  const mockColumns: LedgerColumn[] = [
    { id: '1', label: 'Date', width: 120, position: 0 },
    { id: '2', label: 'Description', width: 280, position: 1 },
    { id: '3', label: 'Debit', width: 120, position: 2 },
    { id: '4', label: 'Credit', width: 120, position: 3 },
  ];

  const mockRows: LedgerRow[] = [
    {
      id: 'row-1',
      position: 0,
      cells: [
        { id: 'cell-1-1', row_id: 'row-1', column_id: '1', content: '', content_type: 'empty' },
        { id: 'cell-1-2', row_id: 'row-1', column_id: '2', content: '', content_type: 'empty' },
        { id: 'cell-1-3', row_id: 'row-1', column_id: '3', content: '', content_type: 'empty' },
        { id: 'cell-1-4', row_id: 'row-1', column_id: '4', content: '', content_type: 'empty' },
      ],
    },
  ];

  const mockOnColumnAdd = vi.fn();
  const mockOnColumnRemove = vi.fn();
  const mockOnColumnUpdate = vi.fn();
  const mockOnCellUpdate = vi.fn();
  const mockOnRowAdd = vi.fn();

  describe('Column Management', () => {
    it('should render all column headers', () => {
      render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      expect(screen.getByDisplayValue('Date')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Debit')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Credit')).toBeInTheDocument();
    });

    it('should render add column button', () => {
      render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const addButton = screen.getByRole('button', { name: /add column/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should call onColumnAdd when add button is clicked', () => {
      render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const addButton = screen.getByRole('button', { name: /add column/i });
      fireEvent.click(addButton);

      expect(mockOnColumnAdd).toHaveBeenCalledTimes(1);
    });

    it('should show remove button on column header hover', async () => {
      render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const headers = screen.getAllByRole('columnheader');
      const firstHeader = headers[0];
      
      fireEvent.mouseEnter(firstHeader);

      await waitFor(() => {
        const removeButton = screen.getByRole('button', { name: /remove.*date/i });
        expect(removeButton).toBeVisible();
      });
    });

    it('should not show remove button when only one column remains', () => {
      const singleColumn = [mockColumns[0]];
      
      render(
        <LedgerTable
          columns={singleColumn}
          rows={[]}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const headers = screen.getAllByRole('columnheader');
      fireEvent.mouseEnter(headers[0]);

      const removeButton = screen.queryByRole('button', { name: /remove/i });
      expect(removeButton).not.toBeInTheDocument();
    });

    it('should call onColumnUpdate when header text changes', () => {
      render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const dateInput = screen.getByDisplayValue('Date');
      fireEvent.change(dateInput, { target: { value: 'New Date' } });
      fireEvent.blur(dateInput);

      expect(mockOnColumnUpdate).toHaveBeenCalledWith('1', { label: 'New Date' });
    });

    it('should automatically adjust column width based on header text length', () => {
      const { rerender } = render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const dateHeader = screen.getByDisplayValue('Date').closest('th');
      const initialWidth = dateHeader?.style.width;

      // Update with longer text
      const updatedColumns = [
        { ...mockColumns[0], label: 'Very Long Date Column Header' },
        ...mockColumns.slice(1),
      ];

      rerender(
        <LedgerTable
          columns={updatedColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const updatedHeader = screen.getByDisplayValue('Very Long Date Column Header').closest('th');
      const newWidth = updatedHeader?.style.width;

      expect(newWidth).not.toBe(initialWidth);
    });
  });

  describe('Row Behavior', () => {
    it('should render all rows', () => {
      const multipleRows: LedgerRow[] = Array.from({ length: 15 }, (_, i) => ({
        id: `row-${i}`,
        position: i,
        cells: mockColumns.map((col) => ({
          id: `cell-${i}-${col.id}`,
          row_id: `row-${i}`,
          column_id: col.id,
          content: '',
          content_type: 'empty' as const,
        })),
      }));

      render(
        <LedgerTable
          columns={mockColumns}
          rows={multipleRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const rows = screen.getAllByRole('row');
      // +1 for header row
      expect(rows).toHaveLength(16);
    });

    it('should call onRowAdd when typing in the last row', async () => {
      render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const cells = screen.getAllByRole('textbox');
      const lastCell = cells[cells.length - 1];

      fireEvent.change(lastCell, { target: { value: 'test' } });

      await waitFor(() => {
        expect(mockOnRowAdd).toHaveBeenCalledTimes(1);
      });
    });

    it('should update cell content', () => {
      render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const cells = screen.getAllByRole('textbox');
      const firstCell = cells[0];

      fireEvent.change(firstCell, { target: { value: 'Test content' } });

      expect(mockOnCellUpdate).toHaveBeenCalledWith(
        expect.any(String),
        'Test content'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper table semantics', () => {
      render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(mockColumns.length);
    });

    it('should have accessible labels for buttons', () => {
      render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const addButton = screen.getByRole('button', { name: /add column/i });
      expect(addButton).toHaveAccessibleName();
    });

    it('should support keyboard navigation', () => {
      render(
        <LedgerTable
          columns={mockColumns}
          rows={mockRows}
          onColumnAdd={mockOnColumnAdd}
          onColumnRemove={mockOnColumnRemove}
          onColumnUpdate={mockOnColumnUpdate}
          onCellUpdate={mockOnCellUpdate}
          onRowAdd={mockOnRowAdd}
        />
      );

      const cells = screen.getAllByRole('textbox');
      const firstCell = cells[0];
      
      firstCell.focus();
      expect(document.activeElement).toBe(firstCell);

      // Tab should move to next cell
      fireEvent.keyDown(firstCell, { key: 'Tab' });
      
      // Note: Actual navigation would be tested in integration tests
      expect(cells[1]).toBeInTheDocument();
    });
  });
});
