'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import type { LedgerColumn, LedgerRow } from '@/types/ledger';
import { MIN_COLUMN_WIDTH } from '@/types/ledger';

interface LedgerTableProps {
  columns: LedgerColumn[];
  rows: LedgerRow[];
  onColumnAdd: () => void;
  onColumnRemove: (columnId: string) => void;
  onColumnUpdate: (columnId: string, updates: Partial<LedgerColumn>) => void;
  onCellUpdate: (cellId: string, content: string) => void;
  onRowAdd: () => void;
}

export function LedgerTable({
  columns,
  rows,
  onColumnAdd,
  onColumnRemove,
  onColumnUpdate,
  onCellUpdate,
  onRowAdd,
}: LedgerTableProps) {
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Calculate column width based on text length
  const calculateColumnWidth = (label: string, baseWidth: number): number => {
    const charWidth = 8; // approximate pixels per character
    const padding = 40; // padding and borders
    const calculatedWidth = label.length * charWidth + padding;
    return Math.max(MIN_COLUMN_WIDTH, Math.max(calculatedWidth, baseWidth));
  };

  // Handle cell change and check if we need to add a new row
  const handleCellChange = (cellId: string, content: string, rowIndex: number) => {
    onCellUpdate(cellId, content);

    // If typing in the last row, add a new row
    if (content && rowIndex === rows.length - 1) {
      onRowAdd();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextColIndex = colIndex + 1;
      
      if (nextColIndex < columns.length) {
        // Move to next cell in same row
        setFocusedCell({ rowIndex, colIndex: nextColIndex });
      } else if (rowIndex + 1 < rows.length) {
        // Move to first cell of next row
        setFocusedCell({ rowIndex: rowIndex + 1, colIndex: 0 });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Move to same column in next row
      if (rowIndex + 1 < rows.length) {
        setFocusedCell({ rowIndex: rowIndex + 1, colIndex });
      }
    }
  };

  // Auto-focus cells when focusedCell changes
  useEffect(() => {
    if (focusedCell && tableRef.current) {
      const input = tableRef.current.querySelector(
        `[data-row="${focusedCell.rowIndex}"][data-col="${focusedCell.colIndex}"]`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  }, [focusedCell]);

  return (
    <div className="overflow-x-auto -mx-6 px-6 sm:-mx-8 sm:px-8">
      <table
        ref={tableRef}
        role="table"
        className="w-full border-collapse"
        style={{ minWidth: '100%' }}
      >
        <thead className="sticky top-0 z-10 bg-[#F8F6EE]">
          <tr>
            {columns.map((column, index) => {
              const width = calculateColumnWidth(column.label, column.width);
              const canRemove = columns.length > 1;

              return (
                <th
                  key={column.id}
                  role="columnheader"
                  className="relative border-b-2 border-[#D8D2C2] bg-[#F8F6EE] p-2"
                  style={{ width: `${width}px`, minWidth: `${MIN_COLUMN_WIDTH}px` }}
                  onMouseEnter={() => setHoveredColumn(column.id)}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={column.label}
                      onChange={(e) => onColumnUpdate(column.id, { label: e.target.value })}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          onColumnUpdate(column.id, { 
                            label: e.target.value.trim(),
                            width: calculateColumnWidth(e.target.value.trim(), column.width)
                          });
                        }
                      }}
                      className="w-full border-none bg-transparent text-sm font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#14B8A6] rounded px-1"
                      aria-label={`Column header: ${column.label}`}
                    />
                    {canRemove && hoveredColumn === column.id && (
                      <button
                        onClick={() => onColumnRemove(column.id)}
                        className="flex-shrink-0 p-1 text-[#64748B] hover:text-[#EF4444] rounded transition-colors"
                        aria-label={`Remove column ${column.label}`}
                        title="Remove column"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </th>
              );
            })}
            <th className="border-b-2 border-[#D8D2C2] bg-[#F8F6EE] p-2 w-12">
              <button
                onClick={onColumnAdd}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#14B8A6] text-white hover:bg-[#0F9488] transition-colors"
                aria-label="Add column"
                title="Add column"
              >
                <Plus className="w-4 h-4" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id} className="border-b border-[#D8D2C2]">
              {columns.map((column, colIndex) => {
                const cell = row.cells.find((c) => c.column_id === column.id);
                if (!cell) return null;

                return (
                  <td
                    key={cell.id}
                    className="p-2 sm:p-3 border-r border-[#D8D2C2] last:border-r-0"
                    style={{ minHeight: '44px' }}
                  >
                    <input
                      type="text"
                      value={cell.content}
                      onChange={(e) => handleCellChange(cell.id, e.target.value, rowIndex)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                      onFocus={() => setFocusedCell({ rowIndex, colIndex })}
                      placeholder={column.label === 'Date' ? 'DD/MM/YYYY' : ''}
                      className="w-full border-none bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#14B8A6] rounded px-1 py-2 min-h-[44px] touch-manipulation"
                      data-row={rowIndex}
                      data-col={colIndex}
                      aria-label={`${column.label} row ${rowIndex + 1}`}
                    />
                  </td>
                );
              })}
              <td className="p-2 w-12" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
