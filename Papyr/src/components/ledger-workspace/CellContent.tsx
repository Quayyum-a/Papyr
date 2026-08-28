'use client';

import { LEDGER_CONSTANTS, type CellCoordinates, type LedgerConfig, type LedgerCellData, getCellId } from '@/types/ledger';

interface CellContentProps {
  ledgerConfig: LedgerConfig;
  cells: Record<string, LedgerCellData>;
  selectedCell: CellCoordinates | null;
  recognizingCells?: Set<string>;
}

/**
 * Renders cell content (recognized text, failed recognition indicators) as HTML overlay
 * This replaces raw ink rendering for completed cells - shows text or indicator inside cell bounds
 */
export function CellContent({
  ledgerConfig,
  cells,
  selectedCell,
  recognizingCells = new Set(),
}: CellContentProps) {
  // DEBUG: Log cells state on every render to debug missing recognized text
  // eslint-disable-next-line no-console
  console.log('[CellContent] Render:', {
    cellsKeys: Object.keys(cells),
    cells: JSON.stringify(cells, null, 2),
    selectedCell,
    recognizingCells: Array.from(recognizingCells),
  });

  const { columns, rowCount } = ledgerConfig;

  // Sort columns by position
  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        top: LEDGER_CONSTANTS.HEADER_HEIGHT,
        zIndex: 4, // Above ink layer (zIndex 2), below highlights (zIndex 3)
      }}
      aria-hidden="true"
    >
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="absolute left-0 right-0 flex"
          style={{
            top: rowIndex * LEDGER_CONSTANTS.ROW_HEIGHT,
            height: LEDGER_CONSTANTS.ROW_HEIGHT,
          }}
        >
          {sortedColumns.map((column, columnIndex) => {
            const cellId = getCellId({ columnIndex, rowIndex });
            const cellData = cells[cellId];
            const isSelected =
              !!selectedCell &&
              selectedCell.columnIndex === columnIndex &&
              selectedCell.rowIndex === rowIndex;
            const isRecognizing = recognizingCells.has(cellId);

            // Don't render content for currently selected cell while drawing/recognizing
            // The raw ink is shown on canvas during active session
            if (isSelected || isRecognizing) {
              return (
                <div key={column.id} style={{ width: column.width }} />
              );
            }

            // Render recognized text
            if (cellData?.content_type === 'text' && cellData.value) {
              // Format date columns consistently (MMM DD, YYYY)
              let displayValue = cellData.value;
              if (column.type === 'date') {
                // Parse YYYY-MM-DD string as local date to avoid timezone shift
                // new Date('YYYY-MM-DD') parses as UTC, causing off-by-one in timezones ahead of UTC
                const dateMatch = cellData.value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (dateMatch) {
                  const year = parseInt(dateMatch[1], 10);
                  const month = parseInt(dateMatch[2], 10) - 1; // 0-indexed
                  const day = parseInt(dateMatch[3], 10);
                  const parsedDate = new Date(year, month, day);
                  if (!isNaN(parsedDate.getTime())) {
                    displayValue = parsedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }
                } else {
                  // Fallback for any other format
                  const parsedDate = new Date(cellData.value);
                  if (!isNaN(parsedDate.getTime())) {
                    displayValue = parsedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }
                }
              }
              return (
                <div
                  key={column.id}
                  className="flex items-center px-2 h-full overflow-hidden"
                  style={{ width: column.width }}
                >
                  <span
                    className="text-sm text-gray-900 truncate select-none"
                    style={{ fontFamily: 'Georgia, serif', fontSize: '13px', lineHeight: '1.4' }}
                  >
                    {displayValue}
                  </span>
                </div>
              );
            }

            // Render failed/empty recognition indicator
            if (cellData?.content_type === 'ink' && cellData.value === '') {
              return (
                <div
                  key={column.id}
                  className="flex items-center justify-center h-full"
                  style={{ width: column.width }}
                  title="Unrecognized handwriting - tap to retry"
                >
                  <span
                    className="text-xs text-gray-400 opacity-60 select-none"
                    aria-label="Unrecognized handwriting"
                  >
                    retry
                  </span>
                </div>
              );
            }

            // Render live "today" date for date columns with no stored value
            // This handles both brand-new books and existing books that pre-date the date pre-fill feature
            if (column.type === 'date' && (!cellData || !cellData.value)) {
              const today = new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              return (
                <div
                  key={column.id}
                  className="flex items-center px-2 h-full overflow-hidden pointer-events-none"
                  style={{ width: column.width }}
                >
                  <span
                    className="text-sm text-gray-900 truncate select-none"
                    style={{ fontFamily: 'Georgia, serif', fontSize: '13px', lineHeight: '1.4' }}
                  >
                    {today}
                  </span>
                </div>
              );
            }

            // Empty cell - render nothing
            return <div key={column.id} style={{ width: column.width }} />;
          })}
        </div>
      ))}
    </div>
  );
}