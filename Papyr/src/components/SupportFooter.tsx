'use client';

import { useAuth } from '@/context/AuthContext';

export default function SupportFooter() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 mt-12 pt-8 text-center text-sm text-gray-500">
      <p>Need help?</p>
      <a href="mailto:papyrapp@zohomail.com" className="underline">papyrapp@zohomail.com</a>
    </div>
  );
}
