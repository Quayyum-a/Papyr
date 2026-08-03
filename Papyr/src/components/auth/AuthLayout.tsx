'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white">
        {/* Header with logo */}
        <div className="mb-8">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors"
            aria-label="Back to home"
          >
            <div className="w-10 h-10 rounded-lg border-2 border-gray-900 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">P</span>
            </div>
            <span className="text-lg font-bold text-gray-900">Papyr</span>
          </button>
        </div>

        {/* Form content */}
        {children}
      </div>

      {/* Right side - Visual element */}
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8">
        <div className="text-center max-w-md">
          <svg
            className="w-32 h-32 mx-auto mb-6 text-amber-900 opacity-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={0.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13v13m0-13c1.168.477 2.754.477 4.5.477 2.248 0 4.5-.745 6-2V6m0 13V5m0 13H9m4 5l2-2m0 0l2 2m-2-2v5m0-5V8m0 13h9"
            />
          </svg>
          <h3 className="text-2xl font-bold text-amber-900 mb-3">Your business ledger</h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            Write naturally. Store safely. Access anywhere. All your business records in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
