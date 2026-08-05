// Ledger-related types for the book page view

export interface LedgerColumn {
  id: string;
  label: string;
  width: number; // in pixels
  position: number; // order in table
}

export interface LedgerCell {
  id: string;
  row_id: string;
  column_id: string;
  content: string;
  content_type: 'text' | 'ink' | 'empty';
}

export interface LedgerRow {
  id: string;
  position: number;
  cells: LedgerCell[];
}

export interface LedgerPage {
  id: string;
  book_id: string;
  title: string | null;
  position: number;
  columns: LedgerColumn[];
  rows: LedgerRow[];
  created_at: string;
  updated_at: string;
}

export const DEFAULT_COLUMNS: Omit<LedgerColumn, 'id'>[] = [
  { label: 'Date', width: 120, position: 0 },
  { label: 'Description', width: 280, position: 1 },
  { label: 'Debit', width: 120, position: 2 },
  { label: 'Credit', width: 120, position: 3 },
];

export const MIN_COLUMN_WIDTH = 120;
export const DEFAULT_ROW_COUNT = 15;
