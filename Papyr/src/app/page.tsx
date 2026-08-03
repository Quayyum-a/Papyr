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

          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Zero-Latency Ink</h4>
                <p className="text-sm text-gray-600">Writing feels immediate with {"<"}16ms latency</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Natural Pressure</h4>
                <p className="text-sm text-gray-600">Velocity-based pressure simulation</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Offline First</h4>
                <p className="text-sm text-gray-600">Your data stays with you</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 px-4 text-center text-sm text-gray-500">
        <p>Papyr - Handwritten Digital Ledger for Small Businesses</p>
      </footer>
    </div>
  );
}
