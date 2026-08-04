import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignUpForm } from './SignUpForm';

const { signUp, push } = vi.hoisted(() => ({
  signUp: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
    signUp,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/components/PapyrLogo', () => ({
  PapyrLogo: () => <div data-testid="papyr-logo">Papyr Logo</div>,
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signUp.mockResolvedValue({ error: null, requiresVerification: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('renders Papyr logo', () => {
    render(<SignUpForm />);
    expect(screen.getByTestId('papyr-logo')).toBeInTheDocument();
  });

  it('has right-side image area (hidden on mobile)', () => {
    const { container } = render(<SignUpForm />);
    const rightSide = container.querySelector('.hidden.lg\\:flex');
    expect(rightSide).toBeInTheDocument();
  });

  it('uses two-column layout on large screens', () => {
    const { container } = render(<SignUpForm />);
    const wrapper = container.querySelector('.lg\\:flex-row');
    expect(wrapper).toBeInTheDocument();
  });

  const submitVerificationSignup = async () => {
    fireEvent.change(screen.getByLabelText(/Display name/i), { target: { value: 'Ariyo' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'ariyo@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => expect(signUp).toHaveBeenCalledWith('ariyo@example.com', 'password123', 'Ariyo'));
  };

  it('does not call window.alert when verification is required', async () => {
    signUp.mockResolvedValue({ error: null, requiresVerification: true });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    render(<SignUpForm />);

    await submitVerificationSignup();

    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows a personalized verification dialog', async () => {
    signUp.mockResolvedValue({ error: null, requiresVerification: true });
    render(<SignUpForm />);

    await submitVerificationSignup();

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Ariyo');
    expect(dialog).toHaveTextContent('ariyo@example.com');
  });

  it('navigates to login when the verification modal primary action is clicked', async () => {
    signUp.mockResolvedValue({ error: null, requiresVerification: true });
    render(<SignUpForm />);

    await submitVerificationSignup();
    fireEvent.click(await screen.findByRole('button', { name: /go to login/i }));

    expect(push).toHaveBeenCalledWith('/auth/login');
  });
});
