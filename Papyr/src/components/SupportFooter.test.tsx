import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { useAuth } from '@/context/AuthContext';
import SupportFooter from './SupportFooter';

// Mock the AuthContext module
vi.mock('@/context/AuthContext');

describe('SupportFooter', () => {
  it('renders nothing when user is not authenticated', () => {
    // Mock the useAuth hook to return no user
    (useAuth as Mock).mockReturnValue({ user: null });

    const { container } = render(<SupportFooter />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/need help/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/papyrapp@zohomail.com/i)).not.toBeInTheDocument();
  });

  it('renders the footer when user is authenticated', () => {
    const mockUser = { id: '1', email: 'test@example.com', display_name: 'Test User' };
    (useAuth as Mock).mockReturnValue({ user: mockUser });

    render(<SupportFooter />);
    
    // Check footer exists with correct semantic HTML
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    
    // Check content
    expect(screen.getByText(/need help\?/i)).toBeInTheDocument();
    expect(screen.getByText(/papyrapp@zohomail.com/i)).toBeInTheDocument();
    
    // Check email link
    const emailLink = screen.getByRole('link', {
      name: /papyrapp@zohomail.com/i,
    });
    expect(emailLink).toHaveAttribute('href', 'mailto:papyrapp@zohomail.com');
  });

  it('has proper styling for minimal design', () => {
    const mockUser = { id: '1', email: 'test@example.com', display_name: 'Test User' };
    (useAuth as Mock).mockReturnValue({ user: mockUser });

    render(<SupportFooter />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('border-t', 'border-[#E5E7EB]', 'bg-white');
  });

  it('email link has proper accessibility attributes', () => {
    const mockUser = { id: '1', email: 'test@example.com', display_name: 'Test User' };
    (useAuth as Mock).mockReturnValue({ user: mockUser });

    render(<SupportFooter />);
    
    const emailLink = screen.getByRole('link', {
      name: /papyrapp@zohomail.com/i,
    });
    
    // Check link has hover and focus styles
    expect(emailLink).toHaveClass('underline', 'hover:text-[#111827]');
  });
});
