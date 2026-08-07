'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { LedgerPage } from '@/components/ledger/LedgerPage';
import { LedgerTable } from '@/components/ledger/LedgerTable';
import { PapyrLogo } from '@/components/PapyrLogo';
import { User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { Book } from '@/types/book';
import type { LedgerColumn, LedgerRow, LedgerCell, LedgerConfig, LedgerPageContent, CellCoordinates } from '@/types/ledger';
import { DEFAULT_LEDGER_CONFIG, MIN_COLUMN_WIDTH, DEFAULT_ROW_COUNT, getCellId } from '@/types/ledger';
import { v4 as uuidv4 } from 'uuid';

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
  const [pageContent, setPageContent] = useState<LedgerPageContent | null>(null);

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

      // If no page exists, create default page with ledger content
      if (!pageData) {
        const defaultContent: LedgerPageContent = {
          strokes: [],
          ledger: {
            columns: DEFAULT_LEDGER_CONFIG.columns.map((col, idx) => ({
              ...col,
              id: `col-${idx}`,
            })),
            rowCount: DEFAULT_LEDGER_CONFIG.rowCount,
          },
        };

        const { data: newPage, error: createPageError } = await supabase
          .from('pages')
          .insert({
            book_id: bookId,
            title: null,
            page_number: 0,
            position: 0,
            content: defaultContent,
          })
          .select()
          .single();

        if (createPageError) throw createPageError;
        pageData = newPage;
        setPageContent(defaultContent);
        initializeFromContent(defaultContent);
      } else {
        setPageContent(pageData.content as LedgerPageContent);
        initializeFromContent(pageData.content as LedgerPageContent);
      }

      setPageId(pageData.id);
    } catch (err) {
      console.error('Error loading book and page:', err);
      setError('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const initializeFromContent = (content: LedgerPageContent) => {
    const ledgerConfig = content.ledger || {
      columns: DEFAULT_LEDGER_CONFIG.columns.map((col, idx) => ({ ...col, id: `col-${idx}` })),
      rowCount: DEFAULT_ROW_COUNT,
    };

    const loadedColumns: LedgerColumn[] = ledgerConfig.columns.map((col, idx) => ({
      id: col.id || `col-${idx}`,
      label: col.label,
      width: col.width || MIN_COLUMN_WIDTH,
      position: col.position ?? idx,
    }));

    setColumns(loadedColumns);

    // Create rows with empty cells
    const initialRows: LedgerRow[] = Array.from({ length: ledgerConfig.rowCount }, (_, rowIndex) => ({
      id: `row-${rowIndex}`,
      position: rowIndex,
      cells: loadedColumns.map((col) => ({
        id: getCellId({ columnIndex: col.position, rowIndex }),
        row_id: `row-${rowIndex}`,
        column_id: col.id,
        content: '',
        content_type: 'empty' as const,
      })),
    }));

    setRows(initialRows);
  };

  const savePageContent = useCallback(async () => {
    if (!pageId || !pageContent) return;

    try {
      const updatedContent: LedgerPageContent = {
        ...pageContent,
        ledger: {
          columns: columns.map((col) => ({
            id: col.id,
            label: col.label,
            width: col.width,
            position: col.position,
          })),
          rowCount: pageContent.ledger.rowCount,
        },
      };

      const { error } = await supabase
        .from('pages')
        .update({ content: updatedContent })
        .eq('id', pageId);

      if (error) throw error;
      setPageContent(updatedContent);
    } catch (err) {
      console.error('Error saving page content:', err);
    }
  }, [pageId, pageContent, columns]);

  const handleColumnAdd = () => {
    const newColumn: LedgerColumn = {
      id: uuidv4(),
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
            id: getCellId({ columnIndex: newColumn.position, rowIndex: row.position ?? 0 }),
            row_id: row.id,
            column_id: newColumn.id,
            content: '',
            content_type: 'empty' as const,
          },
        ],
      }))
    );

    savePageContent();
  };

  const handleColumnRemove = (columnId: string) => {
    if (columns.length <= 1) return;

    const columnIndex = columns.findIndex((c) => c.id === columnId);
    if (columnIndex === -1) return;

    const newColumns = columns.filter((col) => col.id !== columnId).map((col, idx) => ({
      ...col,
      position: idx,
    }));

    setColumns(newColumns);
    setRows(
      rows.map((row) => ({
        ...row,
        cells: row.cells.filter((cell) => cell.column_id !== columnId),
      }))
    );

    savePageContent();
  };

  const handleColumnUpdate = (columnId: string, updates: Partial<LedgerColumn>) => {
    setColumns(
      columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col))
    );
    savePageContent();
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
    savePageContent();
  };

  const handleRowAdd = () => {
    const newRow: LedgerRow = {
      id: uuidv4(),
      position: rows.length,
      cells: columns.map((col, colIndex) => ({
        id: getCellId({ columnIndex: colIndex, rowIndex: rows.length }),
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
    savePageContent();
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