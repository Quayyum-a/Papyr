'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LEDGER_CONSTANTS, type CellCoordinates, type LedgerConfig, getCellId } from '@/types/ledger';

interface CellHighlightsProps {
  ledgerConfig: LedgerConfig;
  selectedCell: CellCoordinates | null;
  recognizingCells?: Set<string>;
  onCellSelect: (coords: CellCoordinates | null) => void;
  onCellDoubleClick?: (columnIndex: number, rowIndex: number) => void;
  className?: string;
}

/**
 * Renders invisible cell grid for selection with highlight overlay
 * Creates clickable regions matching the ledger grid
 * Full keyboard navigation with ARIA grid support
 */
export function CellHighlights({
  ledgerConfig,
  selectedCell,
  recognizingCells = new Set(),
  onCellSelect,
  onCellDoubleClick,
  className = '',
}: CellHighlightsProps) {
  const { columns, rowCount } = ledgerConfig;
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [focusedCell, setFocusedCell] = useState<CellCoordinates | null>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Sort columns by position
  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  const focusCell = useCallback((columnIndex: number, rowIndex: number) => {
    const key = `${columnIndex}-${rowIndex}`;
    const cellEl = cellRefsRef.current.get(key);
    cellEl?.focus();
  }, []);

  const announceSelection = useCallback((coords: CellCoordinates | null) => {
    if (announcementRef.current) {
      if (coords) {
        const column = sortedColumns[coords.columnIndex];
        announcementRef.current.textContent =
          `Cell selected: ${column?.label || `Column ${coords.columnIndex + 1}`}, Row ${coords.rowIndex + 1}`;
      } else {
        announcementRef.current.textContent = 'Cell selection cleared';
      }
    }
  }, [sortedColumns]);

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only clear selection if clicking directly on background (not bubbled from cell)
    if (e.target === e.currentTarget) {
      onCellSelect(null);
      setFocusedCell(null);
      announceSelection(null);
    }
  }, [onCellSelect, announceSelection]);

  const handleCellClick = useCallback((columnIndex: number, rowIndex: number) => {
    const coords: CellCoordinates = { columnIndex, rowIndex };

    // Toggle selection: if clicking the same cell, deselect
    if (
      selectedCell &&
      selectedCell.columnIndex === columnIndex &&
      selectedCell.rowIndex === rowIndex
    ) {
      onCellSelect(null);
      setFocusedCell(null);
      announceSelection(null);
    } else {
      onCellSelect(coords);
      setFocusedCell(coords);
      announceSelection(coords);
    }
  }, [selectedCell, onCellSelect, announceSelection]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, columnIndex: number, rowIndex: number) => {
    const coords: CellCoordinates = { columnIndex, rowIndex };

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleCellClick(columnIndex, rowIndex);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (columnIndex < sortedColumns.length - 1) {
          setFocusedCell({ columnIndex: columnIndex + 1, rowIndex });
          focusCell(columnIndex + 1, rowIndex);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (columnIndex > 0) {
          setFocusedCell({ columnIndex: columnIndex - 1, rowIndex });
          focusCell(columnIndex - 1, rowIndex);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < rowCount - 1) {
          setFocusedCell({ columnIndex, rowIndex: rowIndex + 1 });
          focusCell(columnIndex, rowIndex + 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) {
          setFocusedCell({ columnIndex, rowIndex: rowIndex - 1 });
          focusCell(columnIndex, rowIndex - 1);
        }
        break;
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Home = first cell
          setFocusedCell({ columnIndex: 0, rowIndex: 0 });
          focusCell(0, 0);
        } else {
          // Home = first cell in row
          setFocusedCell({ columnIndex: 0, rowIndex });
          focusCell(0, rowIndex);
        }
        break;
      case 'End':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+End = last cell
          const lastCol = sortedColumns.length - 1;
          const lastRow = rowCount - 1;
          setFocusedCell({ columnIndex: lastCol, rowIndex: lastRow });
          focusCell(lastCol, lastRow);
        } else {
          // End = last cell in row
          const lastCol = sortedColumns.length - 1;
          setFocusedCell({ columnIndex: lastCol, rowIndex });
          focusCell(lastCol, rowIndex);
        }
        break;
      case 'PageDown':
        e.preventDefault();
        {
          const newRow = Math.min(rowIndex + 10, rowCount - 1);
          setFocusedCell({ columnIndex, rowIndex: newRow });
          focusCell(columnIndex, newRow);
        }
        break;
      case 'PageUp':
        e.preventDefault();
        {
          const newRow = Math.max(rowIndex - 10, 0);
          setFocusedCell({ columnIndex, rowIndex: newRow });
          focusCell(columnIndex, newRow);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onCellSelect(null);
        setFocusedCell(null);
        announceSelection(null);
        break;
      case 'Tab':
        // Let browser handle tab naturally for grid navigation
        break;
      default:
        break;
    }
  }, [sortedColumns.length, rowCount, handleCellClick, onCellSelect, focusCell, announceSelection]);

  // Sync focusedCell with selectedCell when selection changes externally
  useEffect(() => {
    if (selectedCell && (!focusedCell ||
        focusedCell.columnIndex !== selectedCell.columnIndex ||
        focusedCell.rowIndex !== selectedCell.rowIndex)) {
      setFocusedCell(selectedCell);
    } else if (!selectedCell && focusedCell) {
      setFocusedCell(null);
    }
  }, [selectedCell, focusedCell]);

  return (
    <div
      ref={gridRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        top: LEDGER_CONSTANTS.HEADER_HEIGHT,
        zIndex: 3,
      }}
      onClick={handleBackgroundClick}
      role="grid"
      aria-label="Ledger cells"
      aria-rowcount={rowCount}
      aria-colcount={sortedColumns.length}
    >
      {/* Live region for screen reader announcements */}
      <div
        ref={announcementRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Render grid of cells */}
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="absolute left-0 right-0 flex"
          role="row"
          aria-rowindex={rowIndex + 1}
          style={{
            top: rowIndex * LEDGER_CONSTANTS.ROW_HEIGHT,
            height: LEDGER_CONSTANTS.ROW_HEIGHT,
          }}
        >
          {sortedColumns.map((column, columnIndex) => {
            const isSelected =
              !!selectedCell &&
              selectedCell.columnIndex === columnIndex &&
              selectedCell.rowIndex === rowIndex;

            const isFocused =
              focusedCell &&
              focusedCell.columnIndex === columnIndex &&
              focusedCell.rowIndex === rowIndex;

            const cellKey = `${columnIndex}-${rowIndex}`;
            const cellId = getCellId({ columnIndex, rowIndex });
            const isRecognizing = recognizingCells.has(cellId);

            return (
              <div
                key={column.id}
                ref={(el) => { if (el) cellRefsRef.current.set(cellKey, el); }}
                className={`relative cursor-pointer transition-all duration-100 ease-out ${
                  isSelected
                    ? 'pointer-events-none ring-2 ring-blue-500/70 ring-inset'  // Selected: visible ring, no background
                    : 'hover:bg-black/5 pointer-events-auto'  // Very subtle hover tint (5% black)
                } ${isFocused && !isSelected ? 'ring-2 ring-blue-500/50 ring-inset' : ''}`}
                style={{
                  width: column.width,
                  height: LEDGER_CONSTANTS.ROW_HEIGHT,
                  outline: 'none',
                }}
                onClick={() => handleCellClick(columnIndex, rowIndex)}
                onDoubleClick={() => onCellDoubleClick?.(columnIndex, rowIndex)}
                onKeyDown={(e) => handleCellKeyDown(e, columnIndex, rowIndex)}
                role="gridcell"
                tabIndex={isFocused || isSelected ? 0 : -1}
                aria-label={`${column.label}, Row ${rowIndex + 1}`}
                aria-selected={isSelected}
                aria-colindex={columnIndex + 1}
                aria-rowindex={rowIndex + 1}
              >
                {/* Recognition indicator */}
                {isRecognizing && (
                  <div
                    className="absolute top-0.5 right-0.5 pointer-events-none"
                    aria-label="Recognizing handwriting"
                  >
                    <svg
                      className="w-3 h-3 text-blue-600 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}