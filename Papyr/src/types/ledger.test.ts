import { describe, it, expect } from 'vitest';
import { getCellBounds, type LedgerConfig, LEDGER_CONSTANTS } from './ledger';

describe('getCellBounds', () => {
  const testConfig: LedgerConfig = {
    rowCount: 20,
    columns: [
      { id: 'col-0', label: 'Date', width: 120, position: 0 },
      { id: 'col-1', label: 'Description', width: 280, position: 1 },
      { id: 'col-2', label: 'Debit', width: 120, position: 2 },
      { id: 'col-3', label: 'Credit', width: 120, position: 3 },
    ],
  };

  describe('Valid Cell Coordinates', () => {
    it('should compute bounds for first cell (0, 0)', () => {
      const bounds = getCellBounds(testConfig, 0, 0);

      expect(bounds).not.toBeNull();
      expect(bounds?.x).toBe(0);
      expect(bounds?.y).toBe(LEDGER_CONSTANTS.HEADER_HEIGHT);
      expect(bounds?.width).toBe(120);
      expect(bounds?.height).toBe(LEDGER_CONSTANTS.ROW_HEIGHT);
    });

    it('should compute bounds for cell in second column (1, 0)', () => {
      const bounds = getCellBounds(testConfig, 1, 0);

      expect(bounds).not.toBeNull();
      expect(bounds?.x).toBe(120); // First column width
      expect(bounds?.y).toBe(LEDGER_CONSTANTS.HEADER_HEIGHT);
      expect(bounds?.width).toBe(280);
      expect(bounds?.height).toBe(LEDGER_CONSTANTS.ROW_HEIGHT);
    });

    it('should compute bounds for cell in third column (2, 1)', () => {
      const bounds = getCellBounds(testConfig, 2, 1);

      expect(bounds).not.toBeNull();
      expect(bounds?.x).toBe(400); // 120 + 280
      expect(bounds?.y).toBe(LEDGER_CONSTANTS.HEADER_HEIGHT + LEDGER_CONSTANTS.ROW_HEIGHT);
      expect(bounds?.width).toBe(120);
      expect(bounds?.height).toBe(LEDGER_CONSTANTS.ROW_HEIGHT);
    });

    it('should compute bounds for last column (3, 0)', () => {
      const bounds = getCellBounds(testConfig, 3, 0);

      expect(bounds).not.toBeNull();
      expect(bounds?.x).toBe(520); // 120 + 280 + 120
      expect(bounds?.y).toBe(LEDGER_CONSTANTS.HEADER_HEIGHT);
      expect(bounds?.width).toBe(120);
      expect(bounds?.height).toBe(LEDGER_CONSTANTS.ROW_HEIGHT);
    });

    it('should compute bounds for cell in last row', () => {
      const bounds = getCellBounds(testConfig, 0, 19);

      expect(bounds).not.toBeNull();
      expect(bounds?.x).toBe(0);
      expect(bounds?.y).toBe(LEDGER_CONSTANTS.HEADER_HEIGHT + 19 * LEDGER_CONSTANTS.ROW_HEIGHT);
      expect(bounds?.width).toBe(120);
      expect(bounds?.height).toBe(LEDGER_CONSTANTS.ROW_HEIGHT);
    });

    it('should handle different row heights correctly', () => {
      const bounds0 = getCellBounds(testConfig, 0, 0);
      const bounds1 = getCellBounds(testConfig, 0, 1);
      const bounds2 = getCellBounds(testConfig, 0, 2);

      expect(bounds1?.y).toBe(bounds0!.y + LEDGER_CONSTANTS.ROW_HEIGHT);
      expect(bounds2?.y).toBe(bounds1!.y + LEDGER_CONSTANTS.ROW_HEIGHT);
    });

    it('should accumulate column widths correctly', () => {
      // Manually calculate expected x positions
      const expectedX = [
        0,           // col 0
        120,         // col 1: 0 + 120
        400,         // col 2: 0 + 120 + 280
        520,         // col 3: 0 + 120 + 280 + 120
      ];

      for (let colIdx = 0; colIdx < 4; colIdx++) {
        const bounds = getCellBounds(testConfig, colIdx, 0);
        expect(bounds?.x).toBe(expectedX[colIdx]);
      }
    });
  });

  describe('Invalid Cell Coordinates', () => {
    it('should return null for negative column index', () => {
      const bounds = getCellBounds(testConfig, -1, 0);
      expect(bounds).toBeNull();
    });

    it('should return null for column index out of range', () => {
      const bounds = getCellBounds(testConfig, 4, 0);
      expect(bounds).toBeNull();
    });

    it('should return null for negative row index', () => {
      const bounds = getCellBounds(testConfig, 0, -1);
      expect(bounds).toBeNull();
    });

    it('should return null for row index out of range', () => {
      const bounds = getCellBounds(testConfig, 0, 20);
      expect(bounds).toBeNull();
    });
  });

  describe('Column Position Sorting', () => {
    it('should handle unsorted columns by position', () => {
      const unsortedConfig: LedgerConfig = {
        rowCount: 10,
        columns: [
          { id: 'col-2', label: 'Third', width: 100, position: 2 },
          { id: 'col-0', label: 'First', width: 80, position: 0 },
          { id: 'col-1', label: 'Second', width: 90, position: 1 },
        ],
      };

      // Column index 0 should be position 0 (First, width 80)
      const bounds0 = getCellBounds(unsortedConfig, 0, 0);
      expect(bounds0?.x).toBe(0);
      expect(bounds0?.width).toBe(80);

      // Column index 1 should be position 1 (Second, width 90)
      const bounds1 = getCellBounds(unsortedConfig, 1, 0);
      expect(bounds1?.x).toBe(80);
      expect(bounds1?.width).toBe(90);

      // Column index 2 should be position 2 (Third, width 100)
      const bounds2 = getCellBounds(unsortedConfig, 2, 0);
      expect(bounds2?.x).toBe(170); // 80 + 90
      expect(bounds2?.width).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle config with single column', () => {
      const singleColConfig: LedgerConfig = {
        rowCount: 5,
        columns: [
          { id: 'col-0', label: 'Only', width: 200, position: 0 },
        ],
      };

      const bounds = getCellBounds(singleColConfig, 0, 0);
      expect(bounds?.x).toBe(0);
      expect(bounds?.width).toBe(200);
    });

    it('should handle config with varying column widths', () => {
      const varyingConfig: LedgerConfig = {
        rowCount: 10,
        columns: [
          { id: 'col-0', label: 'Narrow', width: 50, position: 0 },
          { id: 'col-1', label: 'Wide', width: 400, position: 1 },
          { id: 'col-2', label: 'Medium', width: 150, position: 2 },
        ],
      };

      const bounds1 = getCellBounds(varyingConfig, 1, 0);
      expect(bounds1?.x).toBe(50);
      expect(bounds1?.width).toBe(400);

      const bounds2 = getCellBounds(varyingConfig, 2, 0);
      expect(bounds2?.x).toBe(450); // 50 + 400
      expect(bounds2?.width).toBe(150);
    });
  });
});
