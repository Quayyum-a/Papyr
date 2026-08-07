'use client';

import { useState, useRef, useMemo } from 'react';
import { LEDGER_CONSTANTS, type LedgerColumn } from '@/types/ledger';

interface ColumnHeadersProps {
  columns: LedgerColumn[];
  onColumnEdit: (columnId: string, newLabel: string) => void;
  onColumnAdd?: () => void;
  onColumnRemove?: (columnId: string) => void;
  className?: string;
}

/**
 * Renders editable column headers with tap-and-hold to edit
 * Shows add/remove controls for column management
 */
export function ColumnHeaders({
  columns,
  onColumnEdit,
  onColumnAdd,
  onColumnRemove,
  className = '',
}: ColumnHeadersProps) {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);
  
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Sort columns by position
  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  const handlePointerDown = (column: LedgerColumn) => {
    // Start tap-and-hold timer (500ms)
    tapTimerRef.current = setTimeout(() => {
      startEditing(column);
    }, LEDGER_CONSTANTS.TAP_HOLD_DURATION);
  };

  const handlePointerUp = () => {
    // Cancel tap-and-hold if released early
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
  };

  const startEditing = (column: LedgerColumn) => {
    setEditingColumnId(column.id);
    setEditValue(column.label);
    // Focus input after render
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const finishEditing = () => {
    if (editingColumnId && editValue.trim()) {
      onColumnEdit(editingColumnId, editValue.trim());
    }
    setEditingColumnId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingColumnId(null);
      setEditValue('');
    }
  };

  const handleRemoveColumn = (columnId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onColumnRemove && columns.length > 1) {
      onColumnRemove(columnId);
    }
  };

  let xOffset = 0;

  return (
    <div
      className={`absolute top-0 left-0 right-0 flex border-b ${className}`}
      style={{
        height: LEDGER_CONSTANTS.HEADER_HEIGHT,
        backgroundColor: LEDGER_CONSTANTS.PAPER_COLOR,
        borderColor: LEDGER_CONSTANTS.COLUMN_LINE_COLOR,
        zIndex: 3,
      }}
    >
      {sortedColumns.map((column) => {
        const columnXOffset = xOffset;
        xOffset += column.width;
        const isEditing = editingColumnId === column.id;
        const isHovered = hoveredColumnId === column.id;

        return (
          <div
            key={column.id}
            className="relative flex items-center justify-center border-r group"
            style={{
              width: column.width,
              borderColor: LEDGER_CONSTANTS.COLUMN_LINE_COLOR,
            }}
            onPointerDown={() => handlePointerDown(column)}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onMouseEnter={() => setHoveredColumnId(column.id)}
            onMouseLeave={() => setHoveredColumnId(null)}
          >
            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={handleKeyDown}
                className="w-full h-full px-3 text-sm font-medium text-center bg-white border-2 border-blue-500 focus:outline-none"
                maxLength={30}
              />
            ) : (
              <>
                <span className="text-sm font-medium text-gray-700 select-none">
                  {column.label}
                </span>
                
                {/* Remove button (show on hover if more than 1 column) */}
                {onColumnRemove && columns.length > 1 && isHovered && (
                  <button
                    onClick={(e) => handleRemoveColumn(column.id, e)}
                    className="absolute right-1 top-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    aria-label={`Remove ${column.label} column`}
                  >
                    <span className="text-xs">×</span>
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Add column button */}
      {onColumnAdd && (
        <button
          onClick={onColumnAdd}
          className="flex items-center justify-center px-4 bg-gray-50 hover:bg-gray-100 border-r transition-colors"
          style={{
            borderColor: LEDGER_CONSTANTS.COLUMN_LINE_COLOR,
          }}
          aria-label="Add column"
        >
          <span className="text-lg text-gray-600">+</span>
        </button>
      )}
    </div>
  );
}
