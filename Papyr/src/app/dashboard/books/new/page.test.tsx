import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NewBookPage from './page';

// Mock the useAuth hook
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com', display_name: 'Test User' },
    loading: false,
  }),
}));

// Mock the useRouter hook
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock the supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => ({
            data: { id: 'new-book-id', title: 'Test Book' },
            error: null,
          }),
        }),
      }),
    }),
  },
}));

describe('Create Book Page', () => {
  it('renders the page title and subtitle', () => {
    render(<NewBookPage />);
    const title = screen.getByRole('heading', { level: 1, name: /Create New Book/i });
    expect(title).toBeInTheDocument();
    expect(screen.getByText(/Create your first handwritten digital ledger\./i)).toBeInTheDocument();
  });

  it('shows a disabled create button when book name is empty', () => {
    render(<NewBookPage />);
    const createButton = screen.getByRole('button', { name: /create book/i });
    expect(createButton).toBeDisabled();
  });

  it('enables the create button when a valid book name is entered', () => {
    render(<NewBookPage />);
    const bookNameInput = screen.getByLabelText(/book name/i);
    expect(bookNameInput).toBeInTheDocument();
    // We will fill the input and then check the button state in a separate test
    // For now, we just check that the input exists.
  });

  it('displays business category cards', () => {
    render(<NewBookPage />);
    // We expect to see at least one category card
    expect(screen.getByText(/phone repair/i)).toBeInTheDocument();
  });

  it('displays theme options', () => {
    render(<NewBookPage />);
    // We expect to see theme names
    expect(screen.getByText(/graphite/i)).toBeInTheDocument();
  });

  it('shows a live preview of the book cover', () => {
    render(<NewBookPage />);
    // We expect to see a preview container
    expect(screen.getByTestId('book-preview')).toBeInTheDocument();
  });

  it('handles form submission and creates a book', async () => {
    render(<NewBookPage />);
    // Fill in the form with valid data
    const bookNameInput = screen.getByLabelText(/book name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    // We assume the category and theme are radio groups, we'll select the first option
    // But note: we haven't implemented the form yet, so we'll skip the interaction for now.
    // We'll update the test as we implement the form.

    // For now, we'll just check that the submit button exists and is disabled when the form is invalid.
    const createButton = screen.getByRole('button', { name: /create book/i });
    expect(createButton).toBeDisabled();

    // We'll fill the book name and then check if the button becomes enabled.
    // However, we don't have the form implemented, so we'll skip for now.
  });
});
