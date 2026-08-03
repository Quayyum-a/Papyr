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
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-lg sm:text-xl">P</span>
      </div>
      {showText && (
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Papyr</h1>
      )}
    </Link>
  );
}
