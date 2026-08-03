import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AuthContext to provide a mock useAuth
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock the PapyrLogo component to avoid useAuth dependency
vi.mock('@/components/PapyrLogo', () => ({
  PapyrLogo: vi.fn(({ className, showText, href }) => (
    <a href={href || '/'} className={className} data-testid="papyr-logo">
      <span data-testid="papyr-logo-icon">Logo</span>
      <span data-testid="papyr-logo-text">Papyr</span>
    </a>
  )),
}));

import LandingPage from './page';

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the landing page with correct heading', () => {
      render(<LandingPage />);
      expect(screen.getByRole('heading', {
        name: /Your traditional ledger, evolved into a digital handwritten record/i,
      })).toBeVisible();
    });

    it('should render the description text', () => {
      render(<LandingPage />);
      expect(screen.getByText(/Papyr provides a secure, structured digital canvas/i)).toBeInTheDocument();
    });

    it('should render sign in button', () => {
      render(<LandingPage />);
      expect(screen.getByRole('link', { name: /Log in to Your Books/i })).toBeVisible();
    });

    it('should render signup button with correct label', () => {
      render(<LandingPage />);
      expect(screen.getByRole('link', { name: /Start Your Digital Ledger/i })).toBeVisible();
    });

    it('should render logo', () => {
      render(<LandingPage />);
      expect(screen.getByTestId('papyr-logo')).toBeVisible();
    });
  });
});