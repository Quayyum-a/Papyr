// Landing Page - Redirects to dashboard if authenticated, otherwise shows landing page
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>;
  }

  if (user) {
    return <div>Redirecting...</div>;
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
              Your Handwritten Digital Ledger
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Papyr combines the natural simplicity of paper with the reliability and accessibility of digital storage.
              Built for small businesses who prefer the feel of pen on paper.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              Create Account
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