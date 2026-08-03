'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm px-6 py-4 flex items-center gap-4 border-b border-gray-100 h-16 sm:h-20">
        <Image
          src="/favicon.png"
          alt="Papyr Logo"
          width={56}
          height={56}
          className="rounded-lg w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Papyr</h1>
      </header>

      <main className="mt-16 sm:mt-20 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              Your traditional ledger, evolved into a digital handwritten record.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Papyr provides a secure, structured digital canvas for small businesses to manage books, pages, and handwritten ink with precision, speed, and seamless background sync. Built for focus and clarity.
            </p>
          </div>

          <div className="flex flex-col gap-4 justify-center max-w-sm w-full mx-auto">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-center"
            >
              Log in to Your Books
            </Link>
            <Link
              href="/auth/signup"
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors text-center"
            >
              Start Your Digital Ledger
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 px-4 text-center text-sm text-gray-500">
        <p>Papyr - Handwritten Digital Ledger for Small Businesses</p>
      </footer>
    </div>
  );
}
