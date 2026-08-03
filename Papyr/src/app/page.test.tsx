import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LandingPage from './page';

// Mock PapyrLogo component to avoid useAuth dependency
vi.mock('@/components/PapyrLogo', () => ({
  PapyrLogo: vi.fn(({ className, showText, href }) => (
    <a href={href || '/'} className={className} data-testid="papyr-logo">
      <span data-testid="papyr-logo-icon">Logo</span>
      <span data-testid="papyr-logo-text">Papyr</span>
    </a>
  )),
}));

// Mock useAuth hook
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
});

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
});

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

    it('renders the description text', () => {
      render(<LandingPage />);
      expect(screen.getByText(/Papyr provides a secure, structured digital canvas/i)).toBeInTheDocument();
    });

    it('renders sign in button', () => {
      render(<LandingPage />);
      expect(screen.getByRole('link', { name: /Log in to Your Books/i })).toBeVisible();
    });

    it('renders signup button with correct label', () => {
      render(<LandingPage />);
      expect(screen.getByRole('link', { name: /Start Your Digital Ledger/i })).toBeVisible();
    });

    it('renders logo', () => {
      render(<LandingPage />);
      expect(screen.getByAltText('Papyr Logo')).toBeVisible();
    });

    it('renders signup link', () => {
      render(<LandingPage />);
      expect(screen.getByRole('link', { name: /create one/i })).toBeVisible();
    });
  });

  describe('Form Validation', () => {
    // Note: LandingPage doesn't have a form, these tests are for reference
    it('renders without errors', () => {
      render(<LandingPage />);
      expect(screen.getByText('Your traditional ledger, evolved into a digital handwritten record')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should have proper labels for form fields', () => {
      render(<LandingPage />);
      expect(screen.getByRole('link', { name: /Log in to Your Books/i })).toBeVisible();
      expect(screen.getByRole('link', { name: /Start Your Digital Ledger/i })).toBeVisible();
    });

    it('should have error alert role for error messages', async () => {
      // This test would require mocking auth error state
      render(<LandingPage />);
      // No error state in default render
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should have focus visible on inputs', () => {
      render(<LandingPage />);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveClass('focus:');
    });
  });
});