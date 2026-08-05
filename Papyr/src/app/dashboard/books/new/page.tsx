'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { BookCoverPreview } from '@/components/books/BookCoverPreview';
import { THEMES, type Theme } from '@/types/book';

export default function NewBookPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<string>('Graphite'); // default theme
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTheme = THEMES.find((t) => t.name === theme) || THEMES[0];

  const isFormValid = title.trim().length >= 3 && title.trim().length <= 80 && description.trim().length <= 300;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Book name is required');
      return;
    }

    // Validate title length
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 80) {
      setError('Book name must be between 3 and 80 characters');
      return;
    }

    // Validate description length
    if (description.trim().length > 300) {
      setError('Description must not exceed 300 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: insertError } = await supabase
        .from('books')
        .insert({
          title: trimmedTitle,
          description: description.trim(),
          cover_color: selectedTheme.accent,
          cover_theme: theme,
          user_id: user?.id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('New book created:', data);
      router.push('/dashboard/books');
    } catch (err) {
      console.error('Failed to create book:', err);
      setError('Failed to create book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard/books"
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 ml-4">Papyr</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.display_name || user?.email}</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Create New Book</h1>
          <p className="mt-1 text-gray-600">
            Create your first handwritten digital ledger.
          </p>
        </div>

        {/* Progress indicator - presentational only, not a wizard */}
        <div className="mb-8">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2 text-slate-900 font-medium">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">1</span>
              Book Details
            </span>
            <div className="flex-1 h-1 bg-gray-200" />
            <span className="flex items-center gap-2 text-gray-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 text-gray-500 text-xs font-medium">2</span>
              Choose Cover
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <form id="create-book-form" onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-0">
            {/* Left side: Form */}
            <div className="p-6 lg:p-8 space-y-8">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm" role="alert">
                  {error}
                </div>
              )}

              {/* 1. Book Name */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-900 text-sm font-bold">1</span>
                  <label htmlFor="book-name" className="text-lg font-semibold text-gray-900">
                    Book Name <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  id="book-name"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter the name written on your notebook"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                  maxLength={80}
                  aria-describedby="book-name-hint"
                />
                <p id="book-name-hint" className="mt-1 text-xs text-gray-500">
                  Examples: Repair Log, Sales Ledger, Daily Expenses, Customer Records
                </p>
              </section>

              {/* 2. Description (Optional) */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-900 text-sm font-bold">2</span>
                  <label htmlFor="description" className="text-lg font-semibold text-gray-900">
                    Description (Optional)
                  </label>
                </div>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what this ledger will be used for"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  disabled={isLoading}
                  maxLength={300}
                  aria-describedby="description-hint"
                />
                <p id="description-hint" className="mt-1 text-xs text-gray-500">
                  {description.length}/300 characters
                </p>
              </section>

              {/* 3. Cover Design */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-900 text-sm font-bold">3</span>
                  <label className="text-lg font-semibold text-gray-900">Cover Design</label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Select cover theme">
                  {THEMES.map((th) => {
                    const isSelected = theme === th.name;
                    return (
                      <label
                        key={th.name}
                        className={`relative group flex flex-col items-center rounded-lg border p-3 cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="theme"
                          value={th.name}
                          checked={isSelected}
                          onChange={(e) => setTheme(e.target.value)}
                          className="sr-only"
                          aria-label={th.name}
                        />
                        <div className="relative w-full aspect-[4/5] mb-2 rounded overflow-hidden">
                          <BookCoverPreview title={title} theme={th} size="small" />
                        </div>
                        <h3 className="mt-2 text-sm font-medium text-gray-700">{th.name}</h3>
                        {isSelected && (
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white text-xs">
                            ✓
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Choose the cover design for your ledger.
                </p>
              </section>
            </div>

            {/* Right side: Live Preview */}
            <div className="hidden lg:block lg:w-full p-8 border-l border-gray-100 bg-gray-50">
              <div className="mb-4 text-sm font-medium text-gray-700">Live Preview</div>
              <div className="relative w-full max-w-xs mx-auto">
                <BookCoverPreview title={title} theme={selectedTheme} size="large" />
              </div>
            </div>

            {/* Form actions at bottom */}
            <div className="lg:col-span-2 flex justify-end space-x-4 p-6 border-t border-gray-100 bg-gray-50">
              <Link
                href="/dashboard/books"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  !isFormValid
                    ? 'bg-gray-300 text-gray-500 hover:bg-gray-300'
                    : 'bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2'
                }`}
              >
                {isLoading ? 'Creating...' : 'Create Book'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}