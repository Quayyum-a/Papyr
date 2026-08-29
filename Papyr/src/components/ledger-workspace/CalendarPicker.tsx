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
  // View state for drill-down navigation: 'day' (default), 'month', 'year'
  const [view, setView] = useState<'day' | 'month' | 'year'>('day');
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
      if (view === 'day') {
        onClose();
      } else {
        // Go back one level in the drill-down
        setView(prev => prev === 'year' ? 'month' : 'day');
      }
    } else if (e.key === 'Enter') {
      if (view === 'day' && selectedDate) {
        onDateSelect(getCellId(selectedCell!), selectedDate);
        onClose();
      }
    }
  }, [selectedCell, selectedDate, onDateSelect, onClose, view]);

  // Year view handlers
  const handleYearClick = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setView('month');
  };

  const handlePrevDecade = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear() - 10, currentMonth.getMonth(), 1));
  };

  const handleNextDecade = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear() + 10, currentMonth.getMonth(), 1));
  };

  // Month view handlers
  const handleMonthClick = (month: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
    setView('day');
  };

  const handlePrevYear = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
  };

  const handleNextYear = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
  };

  // Day view handlers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getYearName = (date: Date) => {
    return date.getFullYear().toString();
  };

  const getMonthShortName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short' });
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

  // Render different views based on state
  const renderYearView = () => (
    <>
      {/* Year header with decade navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevDecade}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Previous decade"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span
          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
          onClick={() => setView('year')}
          aria-label="Current decade"
        >
          {currentMonth.getFullYear() - 5}–{currentMonth.getFullYear() + 4}
        </span>
        <button
          type="button"
          onClick={handleNextDecade}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Next decade"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Year grid */}
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 12 }).map((_, i) => {
          const year = currentMonth.getFullYear() - 5 + i;
          const isSelected = selectedDate && year === selectedDate.getFullYear();
          const isCurrentYear = year === today.getFullYear();

          return (
            <button
              key={`year-${year}`}
              type="button"
              onClick={() => handleYearClick(year)}
              className={`w-full h-12 text-sm rounded-lg transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : isCurrentYear
                  ? 'bg-blue-50 text-blue-700 font-medium hover:bg-blue-100'
                  : 'text-gray-900 hover:bg-gray-100'
              }`}
              aria-label={year.toString()}
              aria-selected={isSelected || undefined}
            >
              {year}
            </button>
          );
        })}
      </div>
    </>
  );

  const renderMonthView = () => (
    <>
      {/* Month header with year navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevYear}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Previous year"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span
          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
          onClick={() => setView('month')}
          aria-label="Current year"
        >
          {getYearName(currentMonth)}
        </span>
        <button
          type="button"
          onClick={handleNextYear}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Next year"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 12 }).map((_, i) => {
          const monthDate = new Date(currentMonth.getFullYear(), i, 1);
          const isSelected = selectedDate &&
            i === selectedDate.getMonth() &&
            currentMonth.getFullYear() === selectedDate.getFullYear();
          const isCurrentMonth = i === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();

          return (
            <button
              key={`month-${i}`}
              type="button"
              onClick={() => handleMonthClick(i)}
              className={`w-full h-12 text-sm rounded-lg transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : isCurrentMonth
                  ? 'bg-blue-50 text-blue-700 font-medium hover:bg-blue-100'
                  : 'text-gray-900 hover:bg-gray-100'
              }`}
              aria-label={getMonthShortName(monthDate)}
              aria-selected={isSelected || undefined}
            >
              {getMonthShortName(monthDate)}
            </button>
          );
        })}
      </div>
    </>
  );

  const renderDayView = () => (
    <>
      {/* Month/Year header - clickable to open month view */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setView('month')}
          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 px-2 py-1 rounded transition-colors"
          aria-label="Open month picker"
        >
          {getMonthName(currentMonth)}
        </button>
        <button
          type="button"
          onClick={handleNextMonth}
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
    </>
  );

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
        {view === 'year' && renderYearView()}
        {view === 'month' && renderMonthView()}
        {view === 'day' && renderDayView()}

        {/* Action buttons - only in day view */}
        {view === 'day' && (
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
        )}
      </div>
    </div>
  );
}