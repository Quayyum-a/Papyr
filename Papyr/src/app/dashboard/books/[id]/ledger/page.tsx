'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLedgerWorkspace } from '@/hooks/useLedgerWorkspace';
import { LedgerCanvas } from '@/components/ledger-workspace/LedgerCanvas';
import { ColumnHeaders } from '@/components/ledger-workspace/ColumnHeaders';
import { CellHighlights } from '@/components/ledger-workspace/CellHighlights';
import { PapyrLogo } from '@/components/PapyrLogo';
import { PEN_CONFIGS, type PenSize } from '@/lib/ink-engine/types';
import type { LedgerPageContent } from '@/types/ledger';
import { supabase } from '@/lib/supabase/client';

interface PageData {
  id: string;
  book_id: string;
  page_number: number;
  position: number;
  content: LedgerPageContent | null;
  created_at: string;
  updated_at: string;
}

export default function BookLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const [pageId, setPageId] = useState<string | null>(null);
  const [initialContent, setInitialContent] = useState<LedgerPageContent | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Save function with Supabase integration
  const handleSave = async (content: LedgerPageContent) => {
    if (!pageId) {
      console.warn('Cannot save: No page ID');
      return;
    }

    try {
      const { error: saveError } = await supabase
        .from('pages')
        .update({ 
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageId);

      if (saveError) {
        console.error('Failed to save page:', saveError);
        throw saveError;
      }

      console.log('Page saved successfully');
    } catch (err) {
      console.error('Save error:', err);
      // Don't throw - just log the error so workspace continues working
    }
  };

  const workspace = useLedgerWorkspace({
    bookId,
    pageId,
    initialContent,
    onSave: handleSave,
  });

  // Load page data from Supabase
  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Not authenticated');
          router.push('/auth/login');
          return;
        }

        // Query for existing pages in this book
        const { data: pages, error: queryError } = await supabase
          .from('pages')
          .select('*')
          .eq('book_id', bookId)
          .order('position', { ascending: true })
          .limit(1);

        if (queryError) {
          console.error('Query error:', queryError);
          throw queryError;
        }

        // If pages exist, use the first one
        if (pages && pages.length > 0) {
          const page = pages[0] as PageData;
          setPageId(page.id);
          
          // Set initial content if it exists
          if (page.content) {
            setInitialContent(page.content as LedgerPageContent);
          }
        } else {
          // No pages exist - create default ledger page
          console.log('No pages found, creating default ledger page...');
          
          const { data: newPageId, error: createError } = await supabase
            .rpc('create_default_ledger_page', { p_book_id: bookId });

          if (createError) {
            console.error('Create error:', createError);
            throw createError;
          }

          if (!newPageId) {
            throw new Error('Failed to create default page');
          }

          console.log('Created default page:', newPageId);
          setPageId(newPageId);
          
          // Load the newly created page to get its content
          const { data: newPage, error: loadError } = await supabase
            .from('pages')
            .select('*')
            .eq('id', newPageId)
            .single();

          if (loadError) {
            console.error('Load new page error:', loadError);
            throw loadError;
          }

          if (newPage && newPage.content) {
            setInitialContent(newPage.content as LedgerPageContent);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load page:', err);
        setError(err instanceof Error ? err.message : 'Failed to load page');
        setIsLoading(false);
      }
    };

    if (bookId) {
      loadPage();
    }
  }, [bookId, router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading ledger...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard/books" className="text-blue-600 hover:underline">
            Back to Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm px-6 py-4 flex items-center gap-4 border-b border-gray-100 h-16 sm:h-20">
        <Link href="/dashboard/books" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to Books</span>
        </Link>
        
        <Link 
          href={`/dashboard/books/${bookId}/canvas`}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Canvas
        </Link>
        
        <div className="flex-1" />
        
        {workspace.isSaving && (
          <span className="text-sm text-gray-500">Saving...</span>
        )}
        
        <PapyrLogo href="/dashboard/books" showText={false} />
      </div>

      {/* Main Content */}
      <div className="mt-16 sm:mt-20 flex-1 flex flex-col overflow-hidden">
        <div className="relative flex-1 overflow-hidden bg-white">
          {/* Ledger Workspace */}
          <div className="absolute inset-0">
            {/* Canvas layers */}
            <LedgerCanvas
              ledgerConfig={workspace.ledgerConfig}
              strokes={workspace.strokes}
              currentStroke={workspace.currentPoints}
              currentPenSize={workspace.currentPenSize}
              currentColor={workspace.currentColor}
              onPointerDown={workspace.handlePointerDown}
              onPointerMove={workspace.handlePointerMove}
              onPointerUp={workspace.handlePointerUp}
              onPointerLeave={workspace.handlePointerLeave}
            />

            {/* Overlay layers */}
            <ColumnHeaders
              columns={workspace.ledgerConfig.columns}
              onColumnEdit={workspace.editColumn}
              onColumnAdd={workspace.addColumn}
              onColumnRemove={workspace.removeColumn}
            />

            <CellHighlights
              ledgerConfig={workspace.ledgerConfig}
              selectedCell={workspace.selectedCell}
              onCellSelect={workspace.selectCell}
            />
          </div>

          {/* Toolbar */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2 z-50">
            {/* Pen sizes */}
            <div className="flex gap-2 bg-white rounded-lg shadow-md p-2 flex-wrap">
              {(Object.keys(PEN_CONFIGS) as PenSize[]).map(size => (
                <button
                  key={size}
                  onClick={() => workspace.setPenSize(size)}
                  className={`px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                    workspace.currentPenSize === size 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>

            {/* Color picker */}
            <div className="flex gap-2 bg-white rounded-lg shadow-md p-2 items-center">
              <label htmlFor="pen-color" className="sr-only">
                Pen Color
              </label>
              <input
                id="pen-color"
                type="color"
                value={workspace.currentColor}
                onChange={e => workspace.setPenColor(e.target.value)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded cursor-pointer border-2 border-gray-200 hover:border-gray-400"
                aria-label="Pen color picker"
              />
              <span className="text-xs text-gray-500">{workspace.currentColor.toUpperCase()}</span>
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-2 bg-white rounded-lg shadow-md p-2">
              <button
                onClick={workspace.undo}
                disabled={!workspace.canUndo}
                className="px-2 py-1 sm:px-3 text-xs sm:text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                ↶ Undo
              </button>
              <button
                onClick={workspace.redo}
                disabled={!workspace.canRedo}
                className="px-2 py-1 sm:px-3 text-xs sm:text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                title="Redo (Ctrl+Shift+Z)"
              >
                ↷ Redo
              </button>
            </div>

            {/* Selection info */}
            {workspace.selectedCell && (
              <div className="bg-blue-50 text-blue-700 rounded-lg shadow-md p-2 text-xs">
                Cell selected: Col {workspace.selectedCell.columnIndex}, Row {workspace.selectedCell.rowIndex}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
