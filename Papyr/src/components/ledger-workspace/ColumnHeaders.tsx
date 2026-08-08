'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
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
 * Full keyboard navigation support
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
  const [focusedColumnIndex, setFocusedColumnIndex] = useState<number>(-1);

  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const columnRefsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Sort columns by position
  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  const startEditing = useCallback((column: LedgerColumn) => {
    setEditingColumnId(column.id);
    setEditValue(column.label);
    // Focus input after render
    setTimeout(() => editInputRef.current?.focus(), 0);
  }, []);

  const handlePointerDown = useCallback((column: LedgerColumn) => {
    // Start tap-and-hold timer (500ms)
    tapTimerRef.current = setTimeout(() => {
      startEditing(column);
    }, LEDGER_CONSTANTS.TAP_HOLD_DURATION);
  }, [startEditing]);

  const handlePointerUp = useCallback(() => {
    // Cancel tap-and-hold if released early
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
  }, []);

  const finishEditing = useCallback(() => {
    if (editingColumnId && editValue.trim()) {
      onColumnEdit(editingColumnId, editValue.trim());
    }
    setEditingColumnId(null);
    setEditValue('');
  }, [editingColumnId, editValue, onColumnEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, columnIndex: number) => {
    // Handle editing mode keys
    if (editingColumnId) {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditingColumnId(null);
        setEditValue('');
      }
      return;
    }

    // Navigation keys when not editing
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        startEditing(sortedColumns[columnIndex]);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocusedColumnIndex((prev) => Math.min(prev + 1, sortedColumns.length - 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedColumnIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setFocusedColumnIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedColumnIndex(sortedColumns.length - 1);
        break;
      case 'Delete':
      case 'Backspace':
        if (onColumnRemove && columns.length > 1) {
          e.preventDefault();
          onColumnRemove(sortedColumns[columnIndex].id);
        }
        break;
      default:
        // Start editing on any printable character
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          startEditing(sortedColumns[columnIndex]);
          setEditValue(e.key);
          setTimeout(() => {
            if (editInputRef.current) {
              editInputRef.current.value = e.key;
              editInputRef.current.setSelectionRange(1, 1);
            }
          }, 0);
        }
        break;
    }
  }, [editingColumnId, sortedColumns, columns.length, startEditing, finishEditing, onColumnRemove]);

  const handleRemoveColumn = useCallback((columnId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onColumnRemove && columns.length > 1) {
      onColumnRemove(columnId);
    }
  }, [onColumnRemove, columns.length]);

  // Focus the edit input when editing starts
  useEffect(() => {
    if (editingColumnId) {
      setTimeout(() => editInputRef.current?.focus(), 0);
    }
  }, [editingColumnId]);

  // Focus the column header when focused index changes
  useEffect(() => {
    if (focusedColumnIndex >= 0 && columnRefsRef.current[focusedColumnIndex]) {
      columnRefsRef.current[focusedColumnIndex]?.focus();
    }
  }, [focusedColumnIndex]);

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
      role="row"
      aria-label="Column headers"
      aria-rowindex={1}
    >
      {sortedColumns.map((column, columnIndex) => {
        const columnXOffset = xOffset;
        xOffset += column.width;
        const isEditing = editingColumnId === column.id;
        const isHovered = hoveredColumnId === column.id;
        const isFocused = focusedColumnIndex === columnIndex;

        return (
          <div
            key={column.id}
            ref={(el) => { columnRefsRef.current[columnIndex] = el; }}
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
            onFocus={() => setFocusedColumnIndex(columnIndex)}
            onBlur={() => setFocusedColumnIndex(-1)}
            onKeyDown={(e) => handleKeyDown(e, columnIndex)}
            tabIndex={0}
            role="columnheader"
            aria-label={`${column.label} column header`}
            aria-sort="none"
            aria-colindex={columnIndex + 1}
          >
            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    finishEditing();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setEditingColumnId(null);
                    setEditValue('');
                  }
                }}
                className="w-full h-full px-3 text-sm font-medium text-center bg-white border-2 border-blue-500 focus:outline-none"
                maxLength={30}
                aria-label="Edit column name"
                autoComplete="off"
              />
            ) : (
              <>
                <span className="text-sm font-medium text-gray-700 select-none">
                  {column.label}
                </span>

                {/* Remove button (show on hover or focus if more than 1 column) */}
                {onColumnRemove && columns.length > 1 && (isHovered || isFocused) && (
                  <button
                    onClick={(e) => handleRemoveColumn(column.id, e)}
                    className="absolute right-1 top-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 focus:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    aria-label={`Remove ${column.label} column`}
                    tabIndex={-1}
                  >
                    <span className="text-xs" aria-hidden="true">×</span>
                  </button>
                )}
              </>
            )}
            {/* Focus indicator */}
            {isFocused && !isEditing && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: 'inset 0 0 0 2px #3B82F6',
                  borderRadius: '2px',
                }}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}

      {/* Add column button */}
      {onColumnAdd && (
        <button
          onClick={onColumnAdd}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onColumnAdd();
            }
          }}
          className="flex items-center justify-center px-4 bg-gray-50 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-r transition-colors"
          style={{
            borderColor: LEDGER_CONSTANTS.COLUMN_LINE_COLOR,
          }}
          aria-label="Add new column"
          tabIndex={0}
          role="button"
        >
          <span className="text-lg text-gray-600" aria-hidden="true">+</span>
          <span className="sr-only">Add column</span>
        </button>
      )}
    </div>
  );
}
