'use client';

import { ReactNode } from 'react';

interface LedgerPageProps {
  children: ReactNode;
  bookTitle?: string;
}

export function LedgerPage({ children, bookTitle }: LedgerPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8E4D9] to-[#D8D2C2]">
      {/* Page container with paper effect */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          className="relative bg-[#F8F6EE] rounded-lg shadow-lg overflow-hidden"
          style={{
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Subtle paper grain texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
            }}
          />

          {/* Book title if provided */}
          {bookTitle && (
            <div className="border-b-2 border-[#D8D2C2] px-6 py-4 sm:px-8 sm:py-6">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                {bookTitle}
              </h1>
            </div>
          )}

          {/* Main content area with generous margins */}
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {children}
          </div>

          {/* Subtle page shadow at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.05))',
            }}
          />
        </div>
      </div>
    </div>
  );
}
