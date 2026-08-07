'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { LedgerPage } from '@/components/ledger/LedgerPage';
import { LedgerTable } from '@/components/ledger/LedgerTable';
import { PapyrLogo } from '@/components/PapyrLogo';
import { User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { Book } from '@/types/book';
import type { LedgerColumn, LedgerRow, LedgerCell } from '@/types/ledger';
import { DEFAULT_COLUMNS, DEFAULT_ROW_COUNT, MIN_COLUMN_WIDTH } from '@/types/ledger';

export default function BookLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const bookId = params.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [columns, setColumns] = useState<LedgerColumn[]>([]);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load book and page data
  useEffect(() => {
    if (user && bookId) {
      loadBookAndPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, bookId]);

  const loadBookAndPage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load book
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', user?.id)
        .single();

      if (bookError) throw bookError;
      if (!bookData) {
        setError('Book not found');
        return;
      }

      setBook(bookData);

      // Load or create first page
      const { data: pagesData, error: pageError } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', bookId)
        .order('position', { ascending: true });

      if (pageError) throw pageError;

      let pageData = pagesData && pagesData.length > 0 ? pagesData[0] : null;

      // If no page exists, create default page
      if (!pageData) {
        const { data: newPage, error: createPageError } = await supabase
          .from('pages')
          .insert({
            book_id: bookId,
            title: null,
            page_number: 0,
            position: 0,
          })
          .select()
          .single();

        if (createPageError) throw createPageError;
        pageData = newPage;

        // Create default table with columns
        const { data: newTable, error: createTableError } = await supabase
          .from('tables')
          .insert({
            page_id: pageData.id,
            title: null,
            columns: DEFAULT_COLUMNS,
            rows: [],
            width: 800,
            height: 600,
            position_x: 0,
            position_y: 0,
          })
          .select()
          .single();

        if (createTableError) throw createTableError;

        // Initialize columns and rows from defaults
        await initializeDefaultLedger(pageData.id, newTable.id);
      }

      setPageId(pageData.id);
      await loadLedgerData(pageData.id);
    } catch (err) {
      console.error('Error loading book and page:', err);
      setError('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultLedger = async (pageId: string, tableId: string) => {
    // Create initial columns
    const columnIds = await Promise.all(
      DEFAULT_COLUMNS.map(async (col) => {
        const id = crypto.randomUUID();
        return { ...col, id };
      })
    );

    // Create initial rows
    const initialRows: LedgerRow[] = Array.from({ length: DEFAULT_ROW_COUNT }, (_, i) => ({
      id: crypto.randomUUID(),
      position: i,
      cells: columnIds.map((col) => ({
        id: crypto.randomUUID(),
        row_id: '',
        column_id: col.id,
        content: '',
        content_type: 'empty' as const,
      })),
    }));

    // Update row_id for cells
    initialRows.forEach((row) => {
      row.cells.forEach((cell) => {
        cell.row_id = row.id;
      });
    });

    setColumns(columnIds);
    setRows(initialRows);
  };

  const loadLedgerData = async (pageId: string) => {
    // Load table for this page
    const { data: tablesData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('page_id', pageId);

    if (tableError) throw tableError;

    const tableData = tablesData && tablesData.length > 0 ? tablesData[0] : null;

    if (tableData) {
      // Parse columns from JSONB
      const loadedColumns = (tableData.columns as any[]).map((col, idx) => ({
        id: col.id || crypto.randomUUID(),
        label: col.label,
        width: col.width || MIN_COLUMN_WIDTH,
        position: idx,
      }));

      setColumns(loadedColumns);

      // Load cells
      const { data: cellsData, error: cellsError } = await supabase
        .from('cells')
        .select('*')
        .eq('table_id', tableData.id)
        .order('row_index', { ascending: true });

      if (cellsError) throw cellsError;

      // Group cells by row
      const rowMap = new Map<number, LedgerCell[]>();
      (cellsData || []).forEach((cell: any) => {
        if (!rowMap.has(cell.row_index)) {
          rowMap.set(cell.row_index, []);
        }
        rowMap.get(cell.row_index)!.push({
          id: cell.id,
          row_id: `row-${cell.row_index}`,
          column_id: loadedColumns[cell.column_index]?.id || '',
          content: cell.content_data?.text || '',
          content_type: cell.content_type as 'text' | 'ink' | 'empty',
        });
      });

      // Create rows
      const loadedRows: LedgerRow[] = Array.from(rowMap.entries())
        .map(([rowIndex, cells]) => ({
          id: `row-${rowIndex}`,
          position: rowIndex,
          cells,
        }))
        .sort((a, b) => a.position - b.position);

      // Ensure we have at least DEFAULT_ROW_COUNT rows
      while (loadedRows.length < DEFAULT_ROW_COUNT) {
        const newRow: LedgerRow = {
          id: crypto.randomUUID(),
          position: loadedRows.length,
          cells: loadedColumns.map((col) => ({
            id: crypto.randomUUID(),
            row_id: '',
            column_id: col.id,
            content: '',
            content_type: 'empty' as const,
          })),
        };
        newRow.cells.forEach((cell) => {
          cell.row_id = newRow.id;
        });
        loadedRows.push(newRow);
      }

      setRows(loadedRows);
    }
  };

  const handleColumnAdd = () => {
    const newColumn: LedgerColumn = {
      id: crypto.randomUUID(),
      label: 'New Column',
      width: MIN_COLUMN_WIDTH,
      position: columns.length,
    };

    setColumns([...columns, newColumn]);

    // Add cells for this new column to all rows
    setRows(
      rows.map((row) => ({
        ...row,
        cells: [
          ...row.cells,
          {
            id: crypto.randomUUID(),
            row_id: row.id,
            column_id: newColumn.id,
            content: '',
            content_type: 'empty' as const,
          },
        ],
      }))
    );

    // Persist to database
    saveLedgerData();
  };

  const handleColumnRemove = (columnId: string) => {
    if (columns.length <= 1) return;

    setColumns(columns.filter((col) => col.id !== columnId));
    setRows(
      rows.map((row) => ({
        ...row,
        cells: row.cells.filter((cell) => cell.column_id !== columnId),
      }))
    );

    saveLedgerData();
  };

  const handleColumnUpdate = (columnId: string, updates: Partial<LedgerColumn>) => {
    setColumns(
      columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col))
    );
    saveLedgerData();
  };

  const handleCellUpdate = (cellId: string, content: string) => {
    setRows(
      rows.map((row) => ({
        ...row,
        cells: row.cells.map((cell) =>
          cell.id === cellId
            ? { ...cell, content, content_type: content ? 'text' : 'empty' }
            : cell
        ),
      }))
    );
    saveLedgerData();
  };

  const handleRowAdd = () => {
    const newRow: LedgerRow = {
      id: crypto.randomUUID(),
      position: rows.length,
      cells: columns.map((col) => ({
        id: crypto.randomUUID(),
        row_id: '',
        column_id: col.id,
        content: '',
        content_type: 'empty' as const,
      })),
    };
    newRow.cells.forEach((cell) => {
      cell.row_id = newRow.id;
    });

    setRows([...rows, newRow]);
    saveLedgerData();
  };

  const saveLedgerData = async () => {
    if (!pageId) return;

    try {
      // Update table columns
      const { data: tableData } = await supabase
        .from('tables')
        .select('id')
        .eq('page_id', pageId)
        .single();

      if (tableData) {
        await supabase
          .from('tables')
          .update({
            columns: columns.map((col) => ({
              id: col.id,
              label: col.label,
              width: col.width,
            })),
          })
          .eq('id', tableData.id);
      }
    } catch (err) {
      console.error('Error saving ledger data:', err);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard/books"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/books"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back to books"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <PapyrLogo />
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/books/${bookId}/ledger`}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ✍️ Workspace
              </Link>
              <Link
                href={`/dashboard/books/${bookId}/canvas`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Canvas
              </Link>
              <Link
                href="/profile"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="View profile"
              >
                <User className="w-6 h-6 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Ledger Content */}
      <LedgerPage bookTitle={book?.title}>
        <LedgerTable
          columns={columns}
          rows={rows}
          onColumnAdd={handleColumnAdd}
          onColumnRemove={handleColumnRemove}
          onColumnUpdate={handleColumnUpdate}
          onCellUpdate={handleCellUpdate}
          onRowAdd={handleRowAdd}
        />
      </LedgerPage>
    </div>
  );
}
