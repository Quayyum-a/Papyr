import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { type LedgerConfig, type LedgerColumn, LEDGER_CONSTANTS } from '@/types/ledger';

interface UseLedgerConfigReturn {
  ledgerConfig: LedgerConfig;
  addColumn: () => void;
  editColumn: (columnId: string, newLabel: string) => void;
  removeColumn: (columnId: string) => void;
  setLedgerConfig: (config: LedgerConfig) => void;
}

/**
 * Hook for managing ledger configuration (columns and rows)
 * Provides utilities for adding, editing, and removing columns
 */
export function useLedgerConfig(
  initialConfig: LedgerConfig
): UseLedgerConfigReturn {
  const [ledgerConfig, setLedgerConfig] = useState<LedgerConfig>(initialConfig);
  const prevConfigRef = useRef<string>('');

  // Update ledger config when initialConfig changes (e.g., when initialContent loads)
  // Use JSON string comparison to avoid infinite loops from new object references
  useEffect(() => {
    const configString = JSON.stringify({
      columns: initialConfig.columns.map(c => ({ id: c.id, label: c.label, width: c.width, position: c.position })),
      rowCount: initialConfig.rowCount,
    });

    if (configString !== prevConfigRef.current) {
      prevConfigRef.current = configString;
      setLedgerConfig(initialConfig);
    }
  }, [initialConfig]);

  const addColumn = useCallback(() => {
    setLedgerConfig((prev) => {
      const newColumn: LedgerColumn = {
        id: uuidv4(),
        label: 'New Column',
        width: 120,
        position: prev.columns.length,
      };

      return {
        ...prev,
        columns: [...prev.columns, newColumn],
      };
    });
  }, []);

  const editColumn = useCallback((columnId: string, newLabel: string) => {
    setLedgerConfig((prev) => {
      const updatedColumns = prev.columns.map((col) => {
        if (col.id !== columnId) return col;

        // Calculate new width based on label length
        // Rule: label.length * 9 + 40, min 80px, max 400px
        const calculatedWidth = Math.min(
          Math.max(newLabel.length * 9 + 40, LEDGER_CONSTANTS.MIN_COLUMN_WIDTH),
          LEDGER_CONSTANTS.MAX_COLUMN_WIDTH
        );

        return {
          ...col,
          label: newLabel,
          width: calculatedWidth,
        };
      });

      return {
        ...prev,
        columns: updatedColumns,
      };
    });
  }, []);

  const removeColumn = useCallback((columnId: string) => {
    setLedgerConfig((prev) => {
      // Don't allow removing the last column
      if (prev.columns.length <= 1) return prev;

      const updatedColumns = prev.columns
        .filter((col) => col.id !== columnId)
        .map((col, index) => ({
          ...col,
          position: index, // Re-index positions
        }));

      return {
        ...prev,
        columns: updatedColumns,
      };
    });
  }, []);

  return {
    ledgerConfig,
    addColumn,
    editColumn,
    removeColumn,
    setLedgerConfig,
  };
}
