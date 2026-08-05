'use client';

import { useAuth } from '@/context/AuthContext';

export default function SupportFooter() {
  const { user } = useAuth();

  // Only show footer for authenticated users
  if (!user) {
    return null;
  }

  return (
    <footer className="w-full border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-[#6B7280]">Need help?</p>
          <a
            href="mailto:papyrapp@zohomail.com"
            className="text-sm text-[#6B7280] underline decoration-[#6B7280] underline-offset-2 transition-colors hover:text-[#111827] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:rounded"
          >
            papyrapp@zohomail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
