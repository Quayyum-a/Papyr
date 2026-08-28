'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { LEDGER_CONSTANTS, type LedgerConfig, type CellCoordinates, type LedgerCellData, getCellBounds } from '@/types/ledger';

interface EditableCellProps {
  ledgerConfig: LedgerConfig;
  cells: Record<string, LedgerCellData>;
  selectedCell: CellCoordinates | null;
  onCellValueChange: (cellId: string, value: string, contentType: LedgerCellData['content_type']) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  isVisible?: boolean;
}

/**
 * Renders an inline text input for editing cell content
 * Appears when a cell is double-clicked or Enter/F2 is pressed on a selected cell
 * Supports text, number, and date input types based on column type
 */
export function EditableCell({
  ledgerConfig,
  cells,
  selectedCell,
  onCellValueChange,
  scrollContainerRef,
  isVisible = true,
}: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editCellId, setEditCellId] = useState<string | null>(null);
  const [editColumnType, setEditColumnType] = useState<'text' | 'number' | 'date'>('text');
  const previousSelectionRef = useRef<CellCoordinates | null>(null);

  // Handle keyboard events to start/stop editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || !isVisible) return;

      // Don't handle if already editing or if focus is on another input
      if (isEditing) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Enter or F2 to start editing
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        startEditing(selectedCell);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isEditing, isVisible]);

  // Handle double-click on cell to start editing
  const handleCellDoubleClick = useCallback((columnIndex: number, rowIndex: number) => {
    if (!isVisible) return;
    const coords: CellCoordinates = { columnIndex, rowIndex };
    if (selectedCell && selectedCell.columnIndex === columnIndex && selectedCell.rowIndex === rowIndex) {
      startEditing(coords);
    }
  }, [selectedCell, isVisible]);

  const startEditing = (coords: CellCoordinates) => {
    const cellId = `col-${coords.columnIndex}-row-${coords.rowIndex}`;
    const cellData = cells[cellId];
    const column = ledgerConfig.columns[coords.columnIndex];
    const columnType = column?.type || 'text';

    setEditCellId(cellId);
    setEditColumnType(columnType);
    setEditValue(cellData?.value || '');
    setIsEditing(true);
    previousSelectionRef.current = selectedCell;
  };

  const finishEditing = (save: boolean) => {
    if (!editCellId) return;

    if (save && editValue.trim() !== '') {
      let contentType: LedgerCellData['content_type'] = 'text';
      if (editColumnType === 'number') contentType = 'number';
      else if (editColumnType === 'date') contentType = 'text'; // Dates stored as text in YYYY-MM-DD format

      onCellValueChange(editCellId, editValue.trim(), contentType);
    }

    setIsEditing(false);
    setEditCellId(null);
    setEditValue('');
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  // Handle keyboard in input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditing(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      finishEditing(false);
    } else if (e.key === 'Tab') {
      // Allow tab to move to next cell
      finishEditing(true);
      // Tab navigation is handled by CellHighlights
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close on click outside
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        finishEditing(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing]);

  // Calculate input position and size
  const getInputStyle = () => {
    if (!selectedCell || !editCellId) return {};

    const bounds = getCellBounds(ledgerConfig, selectedCell.columnIndex, selectedCell.rowIndex);
    if (!bounds) return {};

    const scrollTop = scrollContainerRef?.current?.scrollTop || 0;
    const scrollLeft = scrollContainerRef?.current?.scrollLeft || 0;

    return {
      position: 'absolute' as const,
      top: `${bounds.y - scrollTop}px`,
      left: `${bounds.x - scrollLeft}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      zIndex: 10,
      pointerEvents: 'auto' as const,
    };
  };

  if (!isEditing || !selectedCell || !editCellId) {
    return null;
  }

  // Verify the cell being edited is still the selected cell
  const currentCellId = `col-${selectedCell.columnIndex}-row-${selectedCell.rowIndex}`;
  if (currentCellId !== editCellId) {
    return null;
  }

  const column = ledgerConfig.columns[selectedCell.columnIndex];
  const inputType = column?.type === 'number' ? 'number' : 'text';

  return (
    <input
      ref={inputRef}
      type={inputType}
      value={editValue}
      onChange={handleInputChange}
      onKeyDown={handleInputKeyDown}
      onBlur={() => finishEditing(true)}
      onDoubleClick={(e) => e.stopPropagation()} // Prevent double-click from bubbling
      style={{
        ...getInputStyle(),
        padding: '4px 8px',
        border: '2px solid #3B82F6', // Blue border for editing
        borderRadius: '4px',
        backgroundColor: 'white',
        fontSize: '13px',
        fontFamily: 'Georgia, serif',
        lineHeight: '1.4',
        outline: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        boxSizing: 'border-box',
      }}
      aria-label={`Edit ${column?.label || 'cell'}`}
      autoComplete="off"
      spellCheck={false}
      inputMode={inputType === 'number' ? 'numeric' : 'text'}
    />
  );
}