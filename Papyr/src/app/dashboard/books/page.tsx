'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  description?: string;
  cover_color: string;
  created_at: string;
  updated_at: string;
  page_count: number;
}

export default function BooksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    try {
      // TODO: Replace with actual Supabase query
      // For now, mock data
      const mockBooks = [
        {
          id: '1',
          title: 'Business Ledger 2024',
          description: 'Main business ledger for 2024',
          cover_color: '#3B82F6',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-12-01T10:00:00Z',
          page_count: 45,
        },
        {
          id: '2',
          title: 'Client Meetings',
          description: 'Client meeting notes and action items',
          cover_color: '#10B981',
          created_at: '2024-03-20T10:00:00Z',
          updated_at: '2024-11-15T14:30:00Z',
          page_count: 12,
        },
        {
          id: '3',
          title: 'Inventory Log',
          description: 'Inventory tracking and stock levels',
          cover_color: '#F59E0B',
          created_at: '2024-06-10T09:00:00Z',
          updated_at: '2024-11-28T16:45:00Z',
          page_count: 28,
        },
      ];
      setBooks(mockBooks);
    } catch (err) {
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement book creation
    router.push('/dashboard/books/new');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Papyr</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Your Books</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Books</h2>
            <p className="mt-1 text-gray-600">Manage your digital ledgers</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/books/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create New Book
          </button>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253v-13Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No books yet</h3>
            <p className="mt-2 text-gray-500">Create your first digital ledger to get started</p>
            <button
              onClick={() => router.push('/dashboard/books/new')}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/dashboard/books/${book.id}/canvas`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: book.cover_color }}
                  >
                    <span className="text-2xl font-bold text-white">
                      {book.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {book.title}
                    </h3>
                    {book.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {book.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{book.page_count} pages</span>
                  <span>Updated {new Date(book.updated_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}