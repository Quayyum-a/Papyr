'use client';

import { useMemo } from 'react';
import { LEDGER_CONSTANTS, type CellCoordinates, type LedgerConfig } from '@/types/ledger';

interface CellHighlightsProps {
  ledgerConfig: LedgerConfig;
  selectedCell: CellCoordinates | null;
  onCellSelect: (coords: CellCoordinates | null) => void;
  className?: string;
}

/**
 * Renders invisible cell grid for selection with highlight overlay
 * Creates clickable regions matching the ledger grid
 */
export function CellHighlights({
  ledgerConfig,
  selectedCell,
  onCellSelect,
  className = '',
}: CellHighlightsProps) {
  const { columns, rowCount } = ledgerConfig;

  // Sort columns by position
  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  const handleCellClick = (columnIndex: number, rowIndex: number) => {
    const coords: CellCoordinates = { columnIndex, rowIndex };
    
    // Toggle selection: if clicking the same cell, deselect
    if (
      selectedCell &&
      selectedCell.columnIndex === columnIndex &&
      selectedCell.rowIndex === rowIndex
    ) {
      onCellSelect(null);
    } else {
      onCellSelect(coords);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only clear selection if clicking directly on background (not bubbled from cell)
    if (e.target === e.currentTarget) {
      onCellSelect(null);
    }
  };

  return (
    <div
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{
        top: LEDGER_CONSTANTS.HEADER_HEIGHT,
        zIndex: 3,
      }}
      onClick={handleBackgroundClick}
    >
      {/* Render grid of cells */}
      {Array.from({ length: rowCount }).map((_, rowIndex) => {
        let xOffset = 0;

        return (
          <div
            key={rowIndex}
            className="absolute left-0 right-0 flex"
            style={{
              top: rowIndex * LEDGER_CONSTANTS.ROW_HEIGHT,
              height: LEDGER_CONSTANTS.ROW_HEIGHT,
            }}
          >
            {sortedColumns.map((column, columnIndex) => {
              const cellXOffset = xOffset;
              xOffset += column.width;

              const isSelected =
                selectedCell &&
                selectedCell.columnIndex === columnIndex &&
                selectedCell.rowIndex === rowIndex;

              return (
                <div
                  key={column.id}
                  className={`relative cursor-pointer transition-colors ${
                    isSelected ? 'bg-yellow-50' : 'hover:bg-gray-50'
                  }`}
                  style={{
                    width: column.width,
                    height: LEDGER_CONSTANTS.ROW_HEIGHT,
                    left: cellXOffset,
                  }}
                  onClick={() => handleCellClick(columnIndex, rowIndex)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Cell ${column.label} row ${rowIndex + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCellClick(columnIndex, rowIndex);
                    }
                  }}
                >
                  {/* Selected cell highlight */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundColor: LEDGER_CONSTANTS.CELL_HIGHLIGHT_COLOR,
                        opacity: LEDGER_CONSTANTS.CELL_HIGHLIGHT_OPACITY,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
