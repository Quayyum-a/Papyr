import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthLayout } from './AuthLayout';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('AuthLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Papyr logo and branding', () => {
    render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    expect(screen.getByText('Papyr')).toBeInTheDocument();
  });

  it('logo is clickable and labeled as back to home', () => {
    render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    const logoButton = screen.getByRole('button', { name: /back to home/i });
    expect(logoButton).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('has two-column grid layout on large screens', () => {
    const { container } = render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    const gridContainer = container.querySelector('.grid.grid-cols-1.lg:grid-cols-2');
    expect(gridContainer).toBeInTheDocument();
  });

  it('has white background on left side', () => {
    const { container } = render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    const leftSide = container.querySelector('.bg-white');
    expect(leftSide).toBeInTheDocument();
  });

  it('has gradient background on right side', () => {
    const { container } = render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    const rightSide = container.querySelector('.bg-gradient-to-br');
    expect(rightSide).toBeInTheDocument();
  });

  it('displays motivational message on right side', () => {
    render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    expect(screen.getByText(/Your business ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/Write naturally/i)).toBeInTheDocument();
  });

  it('logo button includes P icon', () => {
    const { container } = render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    const logoIcon = container.querySelector('.border-2.border-gray-900');
    expect(logoIcon).toBeInTheDocument();
    expect(screen.getByText('P')).toBeInTheDocument();
  });

  it('right side is hidden on mobile', () => {
    const { container } = render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    const rightSide = container.querySelector('.hidden.lg\\:flex');
    expect(rightSide).toBeInTheDocument();
  });
});
