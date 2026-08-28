import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCellSelection } from './useCellSelection';
import type { CellCoordinates } from '@/types/ledger';

describe('useCellSelection', () => {
  it('should initialize with no selection', () => {
    const { result } = renderHook(() => useCellSelection());

    expect(result.current.selectedCell).toBeNull();
    expect(result.current.selectedCellId).toBeNull();
  });

  it('should select a cell', () => {
    const { result } = renderHook(() => useCellSelection());
    const coords: CellCoordinates = { columnIndex: 1, rowIndex: 2 };

    act(() => {
      result.current.selectCell(coords);
    });

    expect(result.current.selectedCell).toEqual(coords);
    expect(result.current.selectedCellId).toBe('col-1-row-2');
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useCellSelection());
    const coords: CellCoordinates = { columnIndex: 0, rowIndex: 0 };

    act(() => {
      result.current.selectCell(coords);
    });

    expect(result.current.selectedCell).not.toBeNull();

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedCell).toBeNull();
    expect(result.current.selectedCellId).toBeNull();
  });

  it('should check if cell is selected', () => {
    const { result } = renderHook(() => useCellSelection());
    const coords: CellCoordinates = { columnIndex: 2, rowIndex: 3 };

    expect(result.current.isCellSelected(coords)).toBe(false);

    act(() => {
      result.current.selectCell(coords);
    });

    expect(result.current.isCellSelected(coords)).toBe(true);
    expect(result.current.isCellSelected({ columnIndex: 0, rowIndex: 0 })).toBe(false);
  });

  it('should update selectedCellId when cell changes', () => {
    const { result } = renderHook(() => useCellSelection());

    act(() => {
      result.current.selectCell({ columnIndex: 0, rowIndex: 0 });
    });
    expect(result.current.selectedCellId).toBe('col-0-row-0');

    act(() => {
      result.current.selectCell({ columnIndex: 5, rowIndex: 10 });
    });
    expect(result.current.selectedCellId).toBe('col-5-row-10');
  });

  it('should handle null selection', () => {
    const { result } = renderHook(() => useCellSelection());

    act(() => {
      result.current.selectCell({ columnIndex: 1, rowIndex: 1 });
    });

    act(() => {
      result.current.selectCell(null);
    });

    expect(result.current.selectedCell).toBeNull();
    expect(result.current.selectedCellId).toBeNull();
  });
});
