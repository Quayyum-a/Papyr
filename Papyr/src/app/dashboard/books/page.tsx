'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Search, User } from 'lucide-react';
import { PapyrLogo } from '@/components/PapyrLogo';
import { supabase } from '@/lib/supabase/client';

interface Book {
  id: string;
  title: string;
  description?: string;
  cover_color: string;
  created_at: string;
  updated_at: string;
  page_count: number;
}

type FilterTab = 'all' | 'recent';

export default function BooksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [user]);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform books to include page_count (default to 0 for now)
      const booksWithCount = (data || []).map((book: any) => ({
        ...book,
        page_count: 0, // TODO: Get actual page count from pages table
      }));

      setBooks(booksWithCount);
    } catch (err) {
      console.error('Failed to load books:', err);
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    if (activeFilter === 'recent') {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      return matchesSearch && new Date(book.updated_at) > twoDaysAgo;
    }
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <PapyrLogo />
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">My Books</h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => router.push('/dashboard/books/new')}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              New Book
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setActiveFilter('all')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeFilter === 'all'
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('recent')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeFilter === 'recent'
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Recent
            </button>
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253v-13Z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchQuery ? 'No books found' : 'No books yet'}
            </h3>
            <p className="mt-2 text-gray-500">
              {searchQuery ? 'Try a different search' : 'Create your first digital ledger to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/dashboard/books/new')}
                className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Create Your First Book
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBooks.map((book) => (
              <Link
                key={book.id}
                href={`/dashboard/books/${book.id}/canvas`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div
                  className="w-full h-24 rounded-md mb-3 flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: book.cover_color }}
                >
                  <span className="text-3xl font-bold text-white opacity-30">
                    {book.title.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                  {book.title}
                </h3>
                {book.description && (
                  <p className="text-xs text-gray-500 line-clamp-1 mb-3">
                    {book.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{book.page_count} Pages</span>
                  <span>
                    {new Date(book.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
