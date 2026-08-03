// Login Form Component
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { PapyrLogo } from '@/components/PapyrLogo';

export function LoginForm() {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (!error) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div>
            <PapyrLogo href="/" />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome back.</h2>
            <p className="mt-2 text-sm text-gray-600">
              Re-organize your business ledgers. Seamlessly.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm" role="alert">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="you@example.com"
                disabled={isLoading || loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-900">Password</label>
                <a href="/auth/reset-password" className="text-sm text-teal-600 hover:text-teal-700">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="••••••••"
                disabled={isLoading || loading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || loading}
              className="w-full py-3 px-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading || loading ? (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">or</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 border-2 border-gray-400 text-gray-900 font-medium rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors flex items-center justify-center gap-2"
              disabled={isLoading || loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </form>

          <div className="text-center text-sm">
            <span className="text-gray-600">New to Papyr? </span>
            <Link href="/auth/signup" className="font-medium text-teal-600 hover:text-teal-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex flex-1 bg-amber-50 items-center justify-center p-8">
        <div className="relative w-full h-full flex items-center justify-center">
          <svg
            className="w-full h-full max-w-sm max-h-sm text-amber-100"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Decorative illustration for the right side */}
            <circle cx="200" cy="200" r="150" fill="currentColor" opacity="0.1" />
            <path
              d="M150 150 Q200 100, 250 150 T250 250 Q200 300, 150 250 Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
            <circle cx="200" cy="200" r="40" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
            <path
              d="M170 200 L230 200 M200 170 L200 230"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.4"
            />
            {/* Handwriting illustration */}
            <path
              d="M100 120 Q120 100, 140 110 T180 120"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M110 280 Q150 260, 190 290"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M250 140 Q280 160, 300 140"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              opacity="0.4"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
