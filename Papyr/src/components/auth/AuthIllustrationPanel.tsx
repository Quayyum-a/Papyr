'use client';

export function AuthIllustrationPanel() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <style jsx>{`
        @keyframes drawStroke {
          0% {
            stroke-dashoffset: var(--stroke-length);
          }
          60% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .handwriting-stroke {
            animation: none;
            stroke-dashoffset: 0;
          }
        }

        .handwriting-stroke {
          stroke-dasharray: var(--stroke-length);
          animation: drawStroke 6s ease-in-out infinite;
        }

        .handwriting-stroke:nth-of-type(1) {
          animation-delay: 0s;
        }
        .handwriting-stroke:nth-of-type(2) {
          animation-delay: 2s;
        }
        .handwriting-stroke:nth-of-type(3) {
          animation-delay: 4s;
        }
      `}</style>
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
          className="handwriting-stroke"
          style={{ '--stroke-length': '120' } as React.CSSProperties}
          d="M100 120 Q120 100, 140 110 T180 120"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          opacity="0.6"
        />
        <path
          className="handwriting-stroke"
          style={{ '--stroke-length': '140' } as React.CSSProperties}
          d="M110 280 Q150 260, 190 290"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          opacity="0.5"
        />
        <path
          className="handwriting-stroke"
          style={{ '--stroke-length': '80' } as React.CSSProperties}
          d="M250 140 Q280 160, 300 140"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}