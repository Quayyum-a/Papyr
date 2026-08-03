import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PapyrLogo } from './PapyrLogo';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

describe('PapyrLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo image with correct src', () => {
    render(<PapyrLogo />);
    const img = screen.getByAltText('Papyr Logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('renders Papyr text by default', () => {
    render(<PapyrLogo />);
    expect(screen.getByRole('heading', { name: 'Papyr' })).toBeInTheDocument();
  });

  it('hides text when showText is false', () => {
    render(<PapyrLogo showText={false} />);
    expect(screen.queryByRole('heading', { name: 'Papyr' })).not.toBeInTheDocument();
  });

  it('still renders logo when showText is false', () => {
    render(<PapyrLogo showText={false} />);
    expect(screen.getByAltText('Papyr Logo')).toBeInTheDocument();
  });

  it('renders as a link', () => {
    render(<PapyrLogo />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });

  it('defaults to home link when not logged in', () => {
    render(<PapyrLogo />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });

  it('uses custom href when provided', () => {
    render(<PapyrLogo href="/custom" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/custom');
  });

  it('applies custom className', () => {
    const { container } = render(<PapyrLogo className="custom-class" />);
    const link = container.querySelector('a');
    expect(link).toHaveClass('custom-class');
  });

  it('logo has responsive sizing classes', () => {
    render(<PapyrLogo />);
    const img = screen.getByAltText('Papyr Logo');
    expect(img).toHaveClass('w-10', 'h-10', 'sm:w-12', 'sm:h-12');
  });

  it('logo has rounded-lg class', () => {
    render(<PapyrLogo />);
    const img = screen.getByAltText('Papyr Logo');
    expect(img).toHaveClass('rounded-lg');
  });

  it('has flex-shrink-0 for proper alignment', () => {
    render(<PapyrLogo />);
    const img = screen.getByAltText('Papyr Logo');
    expect(img).toHaveClass('flex-shrink-0');
  });

  it('link has hover opacity transition', () => {
    const { container } = render(<PapyrLogo />);
    const link = container.querySelector('a');
    expect(link).toHaveClass('hover:opacity-80', 'transition-opacity');
  });
});
