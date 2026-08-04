'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface PapyrLogoProps {
  className?: string;
  showText?: boolean;
  href?: string;
}

export function PapyrLogo({ className = '', showText = true, href }: PapyrLogoProps) {
  const { user, loading } = useAuth();

  const defaultHref = !loading && user ? '/dashboard/books' : '/';
  const finalHref = href ?? defaultHref;

  return (
    <Link href={finalHref} className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}>
      <Image
        src="/favicon.png"
        alt="Papyr Logo"
        width={56}
        height={56}
        className="rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 self-stretch"
        style={{ width: 'auto' }}
      />
      {showText && (
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Papyr</h1>
      )}
    </Link>
  );
}
