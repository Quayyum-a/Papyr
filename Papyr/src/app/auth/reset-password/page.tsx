'use client';

import { Suspense } from 'react';
import ResetPasswordContent from './ResetPasswordContent';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin h-10 w-10 text-blue-600 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}