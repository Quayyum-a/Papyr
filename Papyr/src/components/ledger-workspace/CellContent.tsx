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
                const parsedDate = new Date(cellData.value);
                if (!isNaN(parsedDate.getTime())) {
                  displayValue = parsedDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
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

            // Render failed/empty recognition indicator (ink icon)
            if (cellData?.content_type === 'ink' && cellData.value === '') {
              return (
                <div
                  key={column.id}
                  className="flex items-center justify-center h-full"
                  style={{ width: column.width }}
                  title="Unrecognized handwriting - tap to retry"
                >
                  <svg
                    className="w-5 h-5 text-gray-400 opacity-60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Unrecognized handwriting"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 18"
                    />
                  </svg>
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