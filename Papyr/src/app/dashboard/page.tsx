'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, FileText, LogOut, MoreHorizontal, Plus, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getBooks } from '@/lib/books';
import type { BookWithPageCount } from '@/types/book';
import { PapyrLogo } from '@/components/PapyrLogo';

interface ActivityItem {
  id: string;
  label: string;
  timestamp: string;
  icon: 'book' | 'page';
}

function formatActivityTime(timestamp: string) {
  const date = new Date(timestamp);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<BookWithPageCount[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const loadBooks = async () => {
      setBooksLoading(true);
      try {
        const result = await getBooks();
        if (active) setBooks(result.data ?? []);
      } finally {
        if (active) setBooksLoading(false);
      }
    };

    loadBooks();
    return () => {
      active = false;
    };
  }, [user]);

  const activities = useMemo<ActivityItem[]>(() => {
    const items = books.flatMap((book) => {
      const bookActivity: ActivityItem[] = [
        { id: `updated-${book.id}`, label: `Updated ${book.title}`, timestamp: book.updated_at, icon: 'book' },
        { id: `created-${book.id}`, label: `Created ${book.title}`, timestamp: book.created_at, icon: 'book' },
      ];
      if (book.last_page) {
        bookActivity.push({
          id: `page-${book.last_page.id}`,
          label: `Updated page ${book.last_page.page_number} in ${book.title}`,
          timestamp: book.last_page.updated_at,
          icon: 'page',
        });
      }
      return bookActivity;
    });

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  }, [books]);

  const displayName = user?.display_name || user?.email || 'there';
  const profileInitials = initials(user?.display_name || user?.email || 'P');

  if (authLoading || booksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const handleBooksClick = () => {
    if (books.length === 0) {
      setMessage('Create a new book to start your digital ledger.');
      return;
    }
    router.push('/dashboard/books');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111827]">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <PapyrLogo />
          <div className="relative">
            <button
              type="button"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#FAFAF8] text-sm font-semibold text-[#111827] transition-colors hover:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              {profileInitials}
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 z-10 w-48 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-lg">
                <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#111827] hover:bg-[#F3F4F6]"><UserRound className="h-4 w-4" />Profile</Link>
                <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#111827] hover:bg-[#F3F4F6]"><Settings className="h-4 w-4" />Settings</Link>
                <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[#111827] hover:bg-[#F3F4F6]"><LogOut className="h-4 w-4" />Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[#6B7280]">Your workspace</p>
          <h1 className="text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl">Welcome back, {displayName}.</h1>
          <p className="mt-3 text-lg text-[#6B7280]">Your digital ledger awaits.</p>
        </div>

        {message && (
          <div role="status" className="mb-6 flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            <span>{message}</span>
            <button type="button" onClick={() => router.push('/dashboard/books/new')} className="font-semibold underline underline-offset-2">Create a new book</button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Books</h2>
              <button type="button" onClick={handleBooksClick} className="text-sm font-medium text-[#6B7280] hover:text-[#111827]">View all</button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <button type="button" onClick={handleBooksClick} aria-label="Your Books" className="group flex min-h-64 flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-7 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F4F6] text-slate-900"><BookOpen className="h-6 w-6" /></div>
                  <h3 className="text-2xl font-bold">My Books</h3>
                  <p className="mt-2 max-w-xs text-[#6B7280]">Open and manage your handwritten ledgers.</p>
                </div>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#111827]">Open Books <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </button>

              <Link href="/dashboard/books/new" className="group flex min-h-64 flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white"><Plus className="h-6 w-6" /></div>
                  <h3 className="text-2xl font-bold">Create New Book</h3>
                  <p className="mt-2 max-w-xs text-[#6B7280]">Start a new handwritten ledger for your business.</p>
                </div>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#111827]">New Book <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            </div>
          </section>

          <aside className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <MoreHorizontal className="h-5 w-5 text-[#6B7280]" aria-hidden="true" />
            </div>
            {activities.length === 0 ? (
              <p className="text-sm leading-6 text-[#6B7280]">No activity yet. Create a book to see your recent work here.</p>
            ) : (
              <ul className="space-y-5">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#111827]">
                      {activity.icon === 'page' ? <FileText className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#111827]">{activity.label}</p>
                      <p className="mt-1 text-xs text-[#6B7280]">{formatActivityTime(activity.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
