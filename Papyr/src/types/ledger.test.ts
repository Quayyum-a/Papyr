import { describe, it, expect } from 'vitest';
import {
  getCellId,
  parseCellId,
  DEFAULT_LEDGER_CONFIG,
  LEDGER_CONSTANTS,
  type LedgerColumn,
  type LedgerConfig,
  type CellCoordinates,
} from './ledger';

describe('Ledger Types', () => {
  describe('getCellId', () => {
    it('should generate correct cell ID from coordinates', () => {
      const coords: CellCoordinates = { columnIndex: 0, rowIndex: 5 };
      expect(getCellId(coords)).toBe('col-0-row-5');
    });

    it('should handle different coordinate values', () => {
      expect(getCellId({ columnIndex: 3, rowIndex: 15 })).toBe('col-3-row-15');
      expect(getCellId({ columnIndex: 0, rowIndex: 0 })).toBe('col-0-row-0');
    });
  });

  describe('parseCellId', () => {
    it('should parse valid cell ID', () => {
      const result = parseCellId('col-2-row-10');
      expect(result).toEqual({ columnIndex: 2, rowIndex: 10 });
    });

    it('should return null for invalid cell ID', () => {
      expect(parseCellId('invalid')).toBeNull();
      expect(parseCellId('col-row-5')).toBeNull();
      expect(parseCellId('col-2-3')).toBeNull();
    });

    it('should return null for null or undefined', () => {
      expect(parseCellId(null)).toBeNull();
      expect(parseCellId(undefined)).toBeNull();
    });

    it('should round-trip with getCellId', () => {
      const coords: CellCoordinates = { columnIndex: 3, rowIndex: 7 };
      const cellId = getCellId(coords);
      const parsed = parseCellId(cellId);
      expect(parsed).toEqual(coords);
    });
  });

  describe('DEFAULT_LEDGER_CONFIG', () => {
    it('should have 4 columns', () => {
      expect(DEFAULT_LEDGER_CONFIG.columns).toHaveLength(4);
    });

    it('should have correct column labels', () => {
      const labels = DEFAULT_LEDGER_CONFIG.columns.map(col => col.label);
      expect(labels).toEqual(['Date', 'Description', 'Debit', 'Credit']);
    });

    it('should have correct column positions', () => {
      DEFAULT_LEDGER_CONFIG.columns.forEach((col, index) => {
        expect(col.position).toBe(index);
      });
    });

    it('should have 20 rows by default', () => {
      expect(DEFAULT_LEDGER_CONFIG.rowCount).toBe(20);
    });
  });

  describe('LEDGER_CONSTANTS', () => {
    it('should have expected row height', () => {
      expect(LEDGER_CONSTANTS.ROW_HEIGHT).toBe(44);
    });

    it('should have reasonable column width constraints', () => {
      expect(LEDGER_CONSTANTS.MIN_COLUMN_WIDTH).toBe(80);
      expect(LEDGER_CONSTANTS.MAX_COLUMN_WIDTH).toBe(400);
      expect(LEDGER_CONSTANTS.MIN_COLUMN_WIDTH).toBeLessThan(
        LEDGER_CONSTANTS.MAX_COLUMN_WIDTH
      );
    });

    it('should have paper color defined', () => {
      expect(LEDGER_CONSTANTS.PAPER_COLOR).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should have tap-hold duration defined', () => {
      expect(LEDGER_CONSTANTS.TAP_HOLD_DURATION).toBe(500);
    });
  });

  describe('Type validation', () => {
    it('should accept valid LedgerColumn', () => {
      const column: LedgerColumn = {
        id: 'test-id',
        label: 'Test Column',
        width: 120,
        position: 0,
      };
      expect(column.label).toBe('Test Column');
    });

    it('should accept valid LedgerConfig', () => {
      const config: LedgerConfig = {
        columns: [
          { id: '1', label: 'Col1', width: 100, position: 0 },
          { id: '2', label: 'Col2', width: 150, position: 1 },
        ],
        rowCount: 10,
      };
      expect(config.columns).toHaveLength(2);
      expect(config.rowCount).toBe(10);
    });
  });
});
