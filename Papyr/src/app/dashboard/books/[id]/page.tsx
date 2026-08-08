'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { LedgerWorkspace } from '@/components/ledger-workspace/LedgerWorkspace';
import { PapyrLogo } from '@/components/PapyrLogo';
import { ChevronLeft, User } from 'lucide-react';
import Link from 'next/link';
import type { Book } from '@/types/book';
import type { LedgerPageContent } from '@/types/ledger';

export default function BookLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const bookId = params.id as string;

  const [book, setBook] = useState<Book | null>(null);
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
        const { createDefaultLedgerPageContent } = await import('@/types/ledger');
        const defaultContent = createDefaultLedgerPageContent();

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
      } else {
        setPageContent(pageData.content as LedgerPageContent);
      }

      setPageId(pageData.id);
    } catch (err) {
      console.error('Error loading book and page:', err);
      setError('Failed to load ledger');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* App Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
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
              {book && (
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[300px]">
                  {book.title}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-3">
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

      {/* Ledger Workspace - fills remaining viewport */}
      <div className="flex-1 min-h-0">
        <LedgerWorkspace
          bookId={bookId}
          pageId={pageId}
          initialContent={pageContent || undefined}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}