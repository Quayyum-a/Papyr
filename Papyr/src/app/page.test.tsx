import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LandingPage from './page';

// Mock useAuth hook
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

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the landing page with correct heading', () => {
    render(<LandingPage />);
    const heading = screen.getByRole('heading', {
      name: /Your traditional ledger, evolved into a digital handwritten record/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<LandingPage />);
    const description = screen.getByText(
      /Papyr provides a secure, structured digital canvas/i
    );
    expect(description).toBeInTheDocument();
  });

  it('renders login button with correct label', () => {
    render(<LandingPage />);
    const loginButton = screen.getByRole('link', { name: /Log in to Your Books/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveAttribute('href', '/auth/login');
  });

  it('renders signup button with correct label', () => {
    render(<LandingPage />);
    const signupButton = screen.getByRole('link', {
      name: /Start Your Digital Ledger/i,
    });
    expect(signupButton).toBeInTheDocument();
    expect(signupButton).toHaveAttribute('href', '/auth/signup');
  });

  it('renders header with logo and title', () => {
    render(<LandingPage />);
    const logo = screen.getByAltText('Papyr Logo');
    expect(logo).toBeInTheDocument();
    const title = screen.getByRole('heading', { name: 'Papyr', level: 1 });
    expect(title).toBeInTheDocument();
  });

  it('renders footer with copyright text', () => {
    render(<LandingPage />);
    const footer = screen.getByText(/Papyr - Handwritten Digital Ledger/i);
    expect(footer).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    const { container } = render(<LandingPage />);
    const header = container.querySelector('header');
    const main = container.querySelector('main');
    const footer = container.querySelector('footer');
    
    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
  });

  it('buttons have proper text-center class for accessibility', () => {
    render(<LandingPage />);
    const buttons = screen.getAllByRole('link', {
      name: /(Log in to Your Books|Start Your Digital Ledger)/i,
    });
    buttons.forEach((button) => {
      expect(button.className).toContain('text-center');
    });
  });
});
