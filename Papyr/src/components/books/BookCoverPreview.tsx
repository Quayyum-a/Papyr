'use client';

import { type Theme } from '@/types/book';

interface BookCoverPreviewProps {
  title: string;
  theme: Theme;
  size?: 'large' | 'small';
}

export function BookCoverPreview({ title, theme, size = 'large' }: BookCoverPreviewProps) {
  const displayTitle = title.trim() || 'Book Name';
  const isLarge = size === 'large';

  return (
    <div
      className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
        isLarge
          ? 'aspect-[4/5] shadow-xl'
          : 'aspect-[4/5] shadow-md'
      }`}
      style={{
        backgroundColor: theme.color,
        boxShadow: isLarge
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      }}
      data-testid={size === 'large' ? 'book-cover-preview-large' : 'book-cover-preview-small'}
    >
      {/* Subtle paper texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'url("/textures/paper.png")' }}
        aria-hidden="true"
      />

      {/* Subtle geometric pattern overlay */}
      <div
        className="absolute inset-0 opacity-3"
        style={{ backgroundImage: 'url("/patterns/geometric.png")' }}
        aria-hidden="true"
      />

      {/* Corner fold effect - top right */}
      <div
        className="absolute top-0 right-0 w-0 h-0 border-16 border-transparent"
        style={{
          borderTopColor: 'rgba(255, 255, 255, 0.15)',
          borderRightColor: 'rgba(255, 255, 255, 0.15)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-0 right-0 w-0 h-0 border-16 border-transparent"
        style={{
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
          borderRightColor: 'rgba(0, 0, 0, 0.1)',
        }}
        aria-hidden="true"
      />

      {/* Embossed geometric mark - centered subtle diamond */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 60 60"
          className={isLarge ? 'w-20 h-20' : 'w-12 h-12'}
          fill="none"
          stroke="currentColor"
          style={{
            stroke: 'rgba(255, 255, 255, 0.08)',
            strokeWidth: '1.5',
          }}
        >
          <path d="M30 8 L52 30 L30 52 L8 30 Z" />
          <path d="M30 18 L42 30 L30 42 L18 30 Z" />
        </svg>
      </div>

      {/* Title text */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 pointer-events-none">
        <h2
          className="font-serif text-center text-white drop-shadow-lg"
          style={{
            fontSize: isLarge ? '1.75rem' : '0.875rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {displayTitle}
        </h2>
      </div>

      {/* Subtle spine indicator on left edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{
          background: 'linear-gradient(90deg, rgba(0,0,0,0.15) 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}