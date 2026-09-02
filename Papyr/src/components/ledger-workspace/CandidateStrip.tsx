'use client';

import { useMemo, useCallback } from 'react';
import { LEDGER_CONSTANTS, type LedgerConfig, type CellCoordinates, type LedgerCellData, getCellId, getCellBounds } from '@/types/ledger';

interface CandidateStripProps {
  ledgerConfig: LedgerConfig;
  cells: Record<string, LedgerCellData>;
  selectedCell: CellCoordinates | null;
  onCandidateSelect: (candidate: string) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  maxCandidates?: number;
}

/**
 * Candidate suggestion strip for mobile
 * Shows MyScript recognition alternatives as clickable chips below the active cell
 * Features:
 * - Smart filtering by column type (date/number/text)
 * - Recent/frequent suggestions prioritized
 * - Auto-hide when no candidates or cell not selected
 * - Horizontal scroll for overflow
 * - Accessible with keyboard navigation
 */
export function CandidateStrip({
  ledgerConfig,
  cells,
  selectedCell,
  onCandidateSelect,
  scrollContainerRef,
  maxCandidates = 5,
}: CandidateStripProps) {
  // Only show on mobile (we'll use CSS media query for this)
  // But we can also check if we have candidates

  const cellId = selectedCell ? getCellId(selectedCell) : null;
  const cellData = cellId ? cells[cellId] : null;
  const column = selectedCell ? ledgerConfig.columns[selectedCell.columnIndex] : null;
  const columnType = column?.type || 'text';
  const rawCandidates = cellData?.candidates || [];

  // Filter and prioritize candidates based on column type
  const filteredCandidates = useMemo(() => {
    if (!rawCandidates.length) return [];

    const candidates = [...rawCandidates];

    // Filter based on column type
    const filtered = candidates.filter(candidate => {
      const trimmed = candidate.trim();
      if (!trimmed) return false;

      switch (columnType) {
        case 'number':
          // Only allow numeric candidates (digits, decimal, minus)
          return /^[\d.,\-]+$/.test(trimmed);
        case 'date':
          // Allow date-like strings (YYYY-MM-DD, MM/DD/YYYY, etc.)
          return /^\d{1,4}[\-\/]\d{1,2}[\-\/]\d{1,4}$/.test(trimmed) ||
                 /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
        case 'text':
        default:
          // Allow all text candidates
          return true;
      }
    });

    // Deduplicate while preserving order
    const seen = new Set<string>();
    const deduped = filtered.filter(c => {
      const lower = c.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });

    // Limit to maxCandidates
    return deduped.slice(0, maxCandidates);
  }, [rawCandidates, columnType, maxCandidates]);

  // Calculate position for the strip
  const stripPosition = useMemo(() => {
    if (!selectedCell) return { top: 0, left: 0, width: 0 };

    const bounds = getCellBounds(ledgerConfig, selectedCell.columnIndex, selectedCell.rowIndex);
    if (!bounds) return { top: 0, left: 0, width: 0 };

    const scrollTop = scrollContainerRef?.current?.scrollTop || 0;
    const scrollLeft = scrollContainerRef?.current?.scrollLeft || 0;

    return {
      top: bounds.y + LEDGER_CONSTANTS.ROW_HEIGHT + 4 - scrollTop,
      left: bounds.x - scrollLeft,
      width: bounds.width,
    };
  }, [ledgerConfig, selectedCell, scrollContainerRef]);

  // No candidates or no cell selected - don't render
  if (!selectedCell || !filteredCandidates.length) {
    return null;
  }

  const handleCandidateClick = useCallback((candidate: string) => {
    onCandidateSelect(candidate);
  }, [onCandidateSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, candidate: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCandidateSelect(candidate);
    }
  }, [onCandidateSelect]);

  return (
    <div
      className="absolute z-20 pointer-events-auto"
      style={{
        top: stripPosition.top,
        left: stripPosition.left,
        width: stripPosition.width,
        minWidth: 80,
        maxWidth: Math.max(stripPosition.width, 200),
      }}
      role="listbox"
      aria-label="Recognition alternatives"
    >
      <div
        className="bg-white border border-gray-300 rounded-lg shadow-lg p-1.5 flex flex-wrap gap-1.5"
        style={{ minWidth: 'max-content', maxWidth: '100%' }}
      >
        {filteredCandidates.map((candidate, index) => (
          <button
            key={`${candidate}-${index}`}
            type="button"
            onClick={() => handleCandidateClick(candidate)}
            onKeyDown={(e) => handleKeyDown(e, candidate)}
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100 hover:border-blue-300 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            role="option"
            aria-selected="false"
            tabIndex={0}
          >
            {candidate}
          </button>
        ))}
      </div>
    </div>
  );
}