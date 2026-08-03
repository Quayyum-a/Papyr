import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignUpForm } from './SignUpForm';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
    signUp: vi.fn().mockResolvedValue({ error: null, requiresVerification: false }),
  }),
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup form with correct heading', () => {
    render(<SignUpForm />);
    expect(screen.getByRole('heading', { name: /Create your account/i })).toBeInTheDocument();
  });

  it('renders all input fields', () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText(/Display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm password/i)).toBeInTheDocument();
  });

  it('renders sign in link for existing users', () => {
    render(<SignUpForm />);
    const signInLink = screen.getByRole('link', { name: /Sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/auth/login');
  });

  it('renders create account button', () => {
    render(<SignUpForm />);
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });

  it('renders Google sign up button', () => {
    render(<SignUpForm />);
    expect(screen.getByRole('button', { name: /Sign up with Google/i })).toBeInTheDocument();
  });

  it('displays password requirement helper text', () => {
    render(<SignUpForm />);
    expect(screen.getByText(/Minimum 8 characters/i)).toBeInTheDocument();
  });

  it('renders divider with or text', () => {
    render(<SignUpForm />);
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('has proper input placeholders', () => {
    render(<SignUpForm />);
    expect(screen.getByPlaceholderText('Display name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
  });

  it('has accessible label structure', () => {
    render(<SignUpForm />);
    const displayNameLabel = screen.getByLabelText(/Display name/i);
    const emailLabel = screen.getByLabelText(/Email/i);
    const passwordLabel = screen.getByLabelText(/^Password$/i);
    expect(displayNameLabel).toBeVisible();
    expect(emailLabel).toBeVisible();
    expect(passwordLabel).toBeVisible();
  });

  it('renders form with proper semantic structure', () => {
    const { container } = render(<SignUpForm />);
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
  });
});
