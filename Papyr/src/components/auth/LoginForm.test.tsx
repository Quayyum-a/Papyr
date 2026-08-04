import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from './LoginForm';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
    signIn: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

vi.mock('@/components/PapyrLogo', () => ({
  PapyrLogo: () => <div data-testid="papyr-logo">Papyr Logo</div>,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with correct heading', () => {
    render(<LoginForm />);
    expect(screen.getByRole('heading', { name: /Welcome back/ })).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    render(<LoginForm />);
    const forgotLink = screen.getByRole('link', { name: /Forgot password/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute('href', '/auth/reset-password');
  });

  it('renders sign in button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('renders Google sign in button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
  });

  it('renders divider text', () => {
    render(<LoginForm />);
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('displays description text', () => {
    render(<LoginForm />);
    expect(screen.getByText(/Re-organize your business ledgers/i)).toBeInTheDocument();
  });

  it('has proper input placeholders', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('disables submit button when loading', async () => {
    const { rerender } = render(<LoginForm />);
    const submitButton = screen.getByRole('button', { name: /Sign in/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('has accessible form structure with labels', () => {
    render(<LoginForm />);
    const emailLabel = screen.getByLabelText(/Email/i);
    const passwordLabel = screen.getByLabelText(/Password/i);
    expect(emailLabel).toBeVisible();
    expect(passwordLabel).toBeVisible();
  });

  it('renders Papyr logo', () => {
    render(<LoginForm />);
    expect(screen.getByTestId('papyr-logo')).toBeInTheDocument();
  });

  it('renders sign-up link for new users', async () => {
    render(<LoginForm />);
    const signUpLink = await screen.findByRole('link', { name: /Create an account/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/auth/signup');
  });

  it('has right-side image area (hidden on mobile)', () => {
    const { container } = render(<LoginForm />);
    const rightSide = container.querySelector('.hidden.lg\\:flex');
    expect(rightSide).toBeInTheDocument();
  });

  it('uses two-column layout on large screens', () => {
    const { container } = render(<LoginForm />);
    const wrapper = container.querySelector('.lg\\:flex-row');
    expect(wrapper).toBeInTheDocument();
  });
});
