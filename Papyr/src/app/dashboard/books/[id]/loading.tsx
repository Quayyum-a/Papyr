'use client';

export default function BookLedgerPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-900 border-t-transparent" />
    </div>
  );
}