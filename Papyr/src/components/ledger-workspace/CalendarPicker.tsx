'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { LEDGER_CONSTANTS, type CellCoordinates, type LedgerConfig, getCellBounds, getCellId } from '@/types/ledger';

interface CalendarPickerProps {
  ledgerConfig: LedgerConfig;
  selectedCell: CellCoordinates | null;
  cells: Record<string, { cellId: string; value: string; content_type: string }>;
  onDateSelect: (cellId: string, date: Date) => void;
  onClose: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Calendar picker component for date cells
 * Appears as a dropdown when a date cell is clicked
 */
export function CalendarPicker({
  ledgerConfig,
  selectedCell,
  cells,
  onDateSelect,
  onClose,
  scrollContainerRef,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track which cell we've initialized for to avoid re-initializing on unrelated cell edits
  const initializedCellIdRef = useRef<string | null>(null);

  // Parse existing cell value if it's a valid date
  // Only re-run when the selected cell changes, not when the whole cells object changes
  useEffect(() => {
    if (selectedCell) {
      const cellId = getCellId(selectedCell);
      const cellValue = cells[cellId]?.value;

      // Only initialize if we haven't initialized for this cell yet,
      // or if the cell's value has changed (external update to this specific cell)
      if (initializedCellIdRef.current !== cellId || cellValue !== cells[initializedCellIdRef.current]?.value) {
        if (cellValue) {
          // Parse YYYY-MM-DD string as local date to avoid timezone shift
          const dateMatch = cellValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          let parsed: Date;
          if (dateMatch) {
            const year = parseInt(dateMatch[1], 10);
            const month = parseInt(dateMatch[2], 10) - 1; // 0-indexed
            const day = parseInt(dateMatch[3], 10);
            parsed = new Date(year, month, day);
          } else {
            // Fallback for any other format
            parsed = new Date(cellValue);
          }
          if (!isNaN(parsed.getTime())) {
            setSelectedDate(parsed);
            setCurrentMonth(parsed);
          } else {
            // Default to today if parsing fails
            const today = new Date();
            setSelectedDate(today);
            setCurrentMonth(today);
          }
        } else {
          // Default to today
          const today = new Date();
          setSelectedDate(today);
          setCurrentMonth(today);
        }
        initializedCellIdRef.current = cellId;
      }
    } else {
      // Reset when no cell is selected
      initializedCellIdRef.current = null;
    }
  }, [selectedCell, cells]);

  // Focus the input when picker opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (selectedDate) {
        onDateSelect(getCellId(selectedCell!), selectedDate);
      }
      onClose();
    }
  }, [selectedCell, selectedDate, onDateSelect, onClose]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
  const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();

  // Calculate picker position relative to the cell
  const getPickerPosition = () => {
    if (!selectedCell) return { top: 0, left: 0 };
    const bounds = getCellBounds(ledgerConfig, selectedCell.columnIndex, selectedCell.rowIndex);
    if (!bounds) return { top: 0, left: 0 };

    const scrollTop = scrollContainerRef?.current?.scrollTop || 0;
    const scrollLeft = scrollContainerRef?.current?.scrollLeft || 0;

    return {
      top: bounds.y + LEDGER_CONSTANTS.ROW_HEIGHT + 4 - scrollTop,
      left: bounds.x - scrollLeft,
    };
  };

  const position = getPickerPosition();

  const handleDayClick = (day: number, monthOffset: number = 0) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, day);
    setSelectedDate(date);
    // If clicking a day from another month, navigate to that month
    if (monthOffset !== 0) {
      setCurrentMonth(date);
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const handleClearClick = () => {
    setSelectedDate(null);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onDateSelect(getCellId(selectedCell!), selectedDate);
    }
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      className="fixed z-50"
      style={{
        top: position.top,
        left: position.left,
      }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Select date"
    >
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[280px]">
        {/* Month/Year header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-medium text-gray-900">{getMonthName(currentMonth)}</span>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Previous month days */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => {
            const day = prevMonthDays - firstDayOfMonth + i + 1;
            const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, day);
            const isSelected = selectedDate &&
              day === selectedDate.getDate() &&
              prevMonth.getMonth() === selectedDate.getMonth() &&
              prevMonth.getFullYear() === selectedDate.getFullYear();

            return (
              <button
                key={`prev-${day}`}
                type="button"
                onClick={() => handleDayClick(day, -1)}
                className={`w-8 h-8 text-sm rounded-full transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-100'
                }`}
                aria-label={`${day} (previous month)`}
                aria-selected={isSelected || undefined}
              >
                {day}
              </button>
            );
          })}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === today.getDate() &&
              currentMonth.getMonth() === today.getMonth() &&
              currentMonth.getFullYear() === today.getFullYear();
            const isSelected = selectedDate &&
              day === selectedDate.getDate() &&
              currentMonth.getMonth() === selectedDate.getMonth() &&
              currentMonth.getFullYear() === selectedDate.getFullYear();

            return (
              <button
                key={`curr-${day}`}
                type="button"
                onClick={() => handleDayClick(day, 0)}
                className={`w-8 h-8 text-sm rounded-full transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : isToday
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                aria-label={isToday ? `Today, ${day}` : String(day)}
                aria-selected={isSelected || undefined}
                aria-current={isToday ? 'date' : undefined}
              >
                {day}
              </button>
            );
          })}

          {/* Next month days */}
          {Array.from({ length: 42 - firstDayOfMonth - daysInMonth }).map((_, i) => {
            const day = i + 1;
            const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day);
            const isSelected = selectedDate &&
              day === selectedDate.getDate() &&
              nextMonth.getMonth() === selectedDate.getMonth() &&
              nextMonth.getFullYear() === selectedDate.getFullYear();

            return (
              <button
                key={`next-${day}`}
                type="button"
                onClick={() => handleDayClick(day, 1)}
                className={`w-8 h-8 text-sm rounded-full transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-100'
                }`}
                aria-label={`${day} (next month)`}
                aria-selected={isSelected || undefined}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={handleTodayClick}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Today
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClearClick}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedDate}
              className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}