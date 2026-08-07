'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { LedgerColumn, LedgerRow } from '@/types/ledger';
import { useInkEngine } from '@/hooks/useInkEngine';

interface LedgerOverlayProps {
  columns: LedgerColumn[];
  rows: LedgerRow[];
  width: number;
  height: number;
  selectedCell: { rowIndex: number; colIndex: number } | null;
  selectedColumn: number | null;
  onCellSelect: (rowIndex: number, colIndex: number) => void;
  onColumnSelect: (colIndex: number) => void;
  onColumnEditStart: (columnIndex: number) => void;
  onColumnEditEnd: (columnIndex: number, newLabel: string) => void;
  onColumnAdd: () => void;
  onColumnRemove: (columnIndex: number) => void;
  onStrokeComplete: (strokeData: any) => void;
}

export function LedgerOverlay({
  columns,
  rows,
  width,
  height,
  selectedCell,
  selectedColumn,
  onCellSelect,
  onColumnSelect,
  onColumnEditStart,
  onColumnEditEnd,
  onColumnAdd,
  onColumnRemove,
  onStrokeComplete
}: LedgerOverlayProps) {
  const [editColumnIndex, setEditColumnIndex] = useState<number | null>(null);
  const [editColumnValue, setEditColumnValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  const { penColor } = useInkEngine();

  // Handle cell selection
  const handleCellClick = useCallback((rowIndex: number, colIndex: number) => {
    onCellSelect(rowIndex, colIndex);
  }, [onCellSelect]);

  // Handle column selection
  const handleColumnClick = useCallback((colIndex: number) => {
    onColumnSelect(colIndex);
  }, [onColumnSelect]);

  // Handle column edit start (tap and hold)
  const handleColumnEditStart = useCallback((colIndex: number) => {
    onColumnEditStart(colIndex);
    setEditColumnIndex(colIndex);
    
    // Set input value after a brief delay to allow state update
    setTimeout(() => {
      const column = columns[colIndex];
      if (column && editInputRef.current) {
        editInputRef.current.value = column.label;
        editInputRef.current.select();
      }
    }, 10);
  }, [columns, onColumnEditStart]);

  // Handle column edit end (blur or enter)
  const handleColumnEditEnd = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const newLabel = e.target.value.trim();
    if (editColumnIndex !== null && editColumnIndex < columns.length) {
      onColumnEditEnd(editColumnIndex, newLabel);
    }
    setEditColumnIndex(null);
    setEditColumnValue('');
  }, [onColumnEditEnd]);

  // Handle key down in edit input
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editInputRef.current.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditColumnIndex(null);
      setEditColumnValue('');
      editInputRef.current.blur();
    }
  }, []);

  // Handle add column button click
  const handleAddColumn = useCallback(() => {
    onColumnAdd();
  }, [onColumnAdd]);

  // Handle remove column button click
  const handleRemoveColumn = useCallback((colIndex: number) => {
    onColumnRemove(colIndex);
  }, [onColumnRemove]);

  // Calculate total columns width for positioning
  const getTotalColumnsWidth = useCallback(() => {
    return columns.reduce((sum, col) => sum + col.width, 0);
  }, [columns]);

  // Calculate column positions
  const getColumnPositions = useCallback(() => {
    const positions: number[] = [];
    let currentPos = 0;
    
    for (const column of columns) {
      positions.push(currentPos);
      currentPos += column.width;
    }
    
    return positions;
  }, [columns]);

  // Render column headers
  const renderColumnHeaders = useCallback(() => {
    if (columns.length === 0) return null;
    
    const columnPositions = getColumnPositions();
    
    return columns.map((column, index) => {
      const isEditing = editColumnIndex === index;
      const isSelected = selectedColumn === index;
      const isHovered = editColumnIndex === null && selectedColumn === null; // Simplified hover state
      
      const left = columnPositions[index];
      const width = column.width;
      
      return (
        <div
          key={column.id}
          className="absolute pointer-events-none"
          style={{ 
            left: `${left}px`,
            top: '0px',
            width: `${width}px`,
            height: '24px', // Header height
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isEditing ? (
            <input
              ref={editInputRef}
              value={editColumnValue}
              onChange={(e) => setEditColumnValue(e.target.value)}
              onBlur={handleColumnEditEnd}
              onKeyDown={handleEditKeyDown}
              autoFocus
              className="input-input w-full h-6 px-2 text-sm font-medium border-none bg-transparent"
              style={{ 
                textAlign: 'center',
                fontWeight: '600',
                letterSpacing: '-0.5px'
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center w-full h-6"
              style={{ 
                backgroundColor: isSelected 
                  ? 'rgba(20, 184, 166, 0.1)' 
                  : 'transparent',
                borderBottom: isSelected 
                  ? '2px solid #14B8A6' 
                  : '1px solid transparent',
                pointerEvents: 'none'
              }}
            >
              <span 
                className="text-sm font-medium text-[#0F172A] font-semibold"
                style={{ 
                  letterSpacing: '-0.5px',
                  fontWeight: isSelected ? '600' : '500'
                }}
              >
                {column.label}
              </span>
            </div>
          )}
        </div>
      );
    });
  }, [
    columns, 
    editColumnIndex, 
    editColumnValue, 
    selectedColumn,
    handleColumnEditEnd,
    handleEditKeyDown,
    getColumnPositions
  ]);

  // Render cell highlights (selection background)
  const renderCellHighlights = useCallback(() => {
    if (!selectedCell) return null;
    
    const { rowIndex, colIndex } = selectedCell;
    
    if (rowIndex < 0 || rowIndex >= rows.length || colIndex < 0 || colIndex >= columns.length) {
      return null;
    }
    
    const columnPositions = getColumnPositions();
    const left = columnPositions[colIndex];
    const width = columns[colIndex].width;
    
    // Calculate row height
    const rowHeight = height / Math.max(rows.length, 1);
    const top = rowIndex * rowHeight;
    
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${rowHeight}px`,
          backgroundColor: 'rgba(255, 251, 234, 0.5)', // Pale yellow with transparency
          borderRadius: '4px',
          pointerEvents: 'none'
        }}
      />
    );
  }, [selectedCell, rows, columns, height, getColumnPositions]);

  // Render column selection highlight (full column highlight)
  const renderColumnHighlight = useCallback(() => {
    if (selectedColumn === null || selectedColumn < 0 || selectedColumn >= columns.length) {
      return null;
    }
    
    const columnPositions = getColumnPositions();
    const left = columnPositions[selectedColumn];
    const width = columns[selectedColumn].width;
    
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${left}px`,
          top: '0px',
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: 'rgba(20, 184, 166, 0.05)', // Very light teal
          borderLeft: '2px solid #14B8A6',
          borderRight: '2px solid #14B8A6',
          pointerEvents: 'none'
        }}
      />
    );
  }, [selectedColumn, columns, height, getColumnPositions]);

  // Render add column button
  const renderAddButton = useCallback(() => {
    const columnPositions = getColumnPositions();
    const totalWidth = getTotalColumnsWidth();
    const left = totalWidth;
    
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${left}px`,
          top: '0px',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <button
          onClick={handleAddColumn}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-[#14B8A6] text-white hover:bg-[#0F9488] transition-colors"
          aria-label="Add column"
          title="Add column"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }, [columns, handleAddColumn, getTotalColumnsWidth, getColumnPositions]);

  // Render remove column buttons (hover show)
  const renderRemoveButtons = useCallback(() => {
    if (columns.length <= 1) return null; // Don't allow removing last column
    
    const columnPositions = getColumnPositions();
    
    return columns.map((column, index) => {
      // Don't show remove button on the last column if it's the only one left
      if (index === columns.length - 1 && columns.length === 1) return null;
      
      const left = columnPositions[index] + column.width - 20; // Position at right edge of header
      
      return (
        <div
          key={column.id}
          className="absolute pointer-events-none"
          style={{
            left: `${left}px`,
            top: '0px',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0.6',
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => {
            // In a real implementation, we'd update hover state
            // For simplicity, we're showing all remove buttons
          }}
          onMouseLeave={(e) => {
            // In a real implementation, we'd update hover state
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveColumn(index);
            }}
            className="flex items-center justify-center w-4 h-4 text-[#64748B] hover:text-[#EF4444] rounded transition-colors"
            aria-label={`Remove column ${column.label}`}
            title="Remove column"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    });
  }, [columns, handleRemoveColumn, getColumnPositions]);

  return (
    <div 
      className="relative w-full h-100p"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`
      }}
    >
      {/* Column highlights (full column selection) */}
      {renderColumnHighlight()}
      
      /* Cell highlights (individual cell selection) */
      {renderCellHighlights()}
      
      /* Column headers */
      {renderColumnHeaders()}
      
      /* Add column button */
      {renderAddButton()}
      
      /* Remove column buttons */
      {renderRemoveButtons()}
    </div>
  );
}
