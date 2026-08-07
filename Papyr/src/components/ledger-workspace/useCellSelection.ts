import { useState, useCallback } from 'react';
import { type CellCoordinates, getCellId } from '@/types/ledger';

interface UseCellSelectionReturn {
  selectedCell: CellCoordinates | null;
  selectedCellId: string | null;
  selectCell: (coords: CellCoordinates | null) => void;
  clearSelection: () => void;
  isCellSelected: (coords: CellCoordinates) => boolean;
}

/**
 * Hook for managing cell selection state
 * Provides utilities for selecting, clearing, and checking cell selection
 */
export function useCellSelection(): UseCellSelectionReturn {
  const [selectedCell, setSelectedCell] = useState<CellCoordinates | null>(null);

  const selectCell = useCallback((coords: CellCoordinates | null) => {
    setSelectedCell(coords);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCell(null);
  }, []);

  const isCellSelected = useCallback(
    (coords: CellCoordinates): boolean => {
      if (!selectedCell) return false;
      return (
        selectedCell.columnIndex === coords.columnIndex &&
        selectedCell.rowIndex === coords.rowIndex
      );
    },
    [selectedCell]
  );

  const selectedCellId = selectedCell ? getCellId(selectedCell) : null;

  return {
    selectedCell,
    selectedCellId,
    selectCell,
    clearSelection,
    isCellSelected,
  };
}
