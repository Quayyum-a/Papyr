// Canvas Page - Redirect to Dashboard Books
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CanvasPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard books page
    router.replace('/dashboard/books');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );
}