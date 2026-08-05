import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAuth } from '@/context/AuthContext';
import SupportFooter from './SupportFooter';

// Mock the AuthContext module
vi.mock('@/context/AuthContext');

describe('SupportFooter', () => {
  it('renders nothing when user is not authenticated', () => {
    // Mock the useAuth hook to return no user
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    render(<SupportFooter />);
    expect(screen.queryByText(/need help/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/papyrapp@zohomail.com/i)).not.toBeInTheDocument();
  });

  it('renders the footer when user is authenticated', () => {
    const mockUser = { id: '1', email: 'test@example.com', display_name: 'Test User' };
    (useAuth as jest.Mock).mockReturnValueOnce({ user: mockUser });

    render(<SupportFooter />);
    expect(screen.getByText(/need help/i)).toBeInTheDocument();
    expect(screen.getByText(/papyrapp@zohomail.com/i)).toBeInTheDocument();
    const emailLink = screen.getByRole('link', {
      name: /papyrapp@zohomail.com/i,
    });
    expect(emailLink).toHaveAttribute('href', 'mailto:papyrapp@zohomail.com');
  });
});
