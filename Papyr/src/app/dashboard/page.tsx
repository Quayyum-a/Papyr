// Dashboard Page (Protected)
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!user) {
    return null;
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
              <span className="text-sm text-gray-600">{user.display_name || user.email}</span>
              <a
                href="/profile"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                Profile
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.display_name || 'there'}!</h2>
          <p className="mt-1 text-gray-600">Your digital ledger awaits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Books</h3>
            <p className="text-gray-600 mb-4">View and manage your digital ledgers</p>
            <a href="/dashboard/books" className="text-blue-600 hover:text-blue-700 font-medium">
              View Books →
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Book</h3>
            <p className="text-gray-600 mb-4">Start a new ledger for your business</p>
            <a href="/dashboard/books/new" className="text-blue-600 hover:text-blue-700 font-medium">
              Create Book →
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Drawing Canvas</h3>
            <p className="text-gray-600 mb-4">Test the zero-latency ink engine</p>
            <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Open Canvas →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}