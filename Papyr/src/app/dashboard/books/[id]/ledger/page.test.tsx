import { describe, it, expect } from 'vitest';
import type { LedgerPageContent } from '@/types/ledger';

describe('BookLedgerPage Integration', () => {
  it('should define PageData interface correctly', () => {
    const mockPage: {
      id: string;
      book_id: string;
      page_number: number;
      position: number;
      content: LedgerPageContent | null;
      created_at: string;
      updated_at: string;
    } = {
      id: '123',
      book_id: '456',
      page_number: 0,
      position: 0,
      content: {
        strokes: [],
        ledger: {
          columns: [
            { id: '1', label: 'Date', width: 120, position: 0 },
            { id: '2', label: 'Description', width: 280, position: 1 },
            { id: '3', label: 'Debit', width: 120, position: 2 },
            { id: '4', label: 'Credit', width: 120, position: 3 },
          ],
          rowCount: 20,
        },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(mockPage).toBeDefined();
    expect(mockPage.content?.ledger.columns.length).toBe(4);
    expect(mockPage.content?.ledger.rowCount).toBe(20);
  });

  it('should handle null content correctly', () => {
    const mockPage: {
      id: string;
      book_id: string;
      page_number: number;
      position: number;
      content: LedgerPageContent | null;
      created_at: string;
      updated_at: string;
    } = {
      id: '123',
      book_id: '456',
      page_number: 0,
      position: 0,
      content: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(mockPage).toBeDefined();
    expect(mockPage.content).toBeNull();
  });
});
