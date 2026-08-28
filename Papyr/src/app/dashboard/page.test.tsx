import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './page';

// Use vi.hoisted to create mocks before vi.mock factories run
const { push, signOut, getBooks } = vi.hoisted(() => ({
  push: vi.fn(),
  signOut: vi.fn(),
  getBooks: vi.fn(),
}));

// Stable user reference to prevent infinite re-renders
const mockUser = {
  id: 'user-1',
  email: 'ariyo@example.com',
  display_name: 'Ariyo Quayyum',
};

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    error: null,
    signOut,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/books', () => ({ getBooks }));

vi.mock('@/components/PapyrLogo', () => ({
  PapyrLogo: () => <div data-testid="papyr-logo">Papyr</div>,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getBooks
    getBooks.mockResolvedValue({
      data: [
        {
          id: 'book-1',
          title: 'Repair Log',
          description: null,
          cover_color: '#111827',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-03T10:00:00Z',
          page_count: 4,
          last_page: { id: 'page-1', page_number: 4, updated_at: '2025-01-03T10:00:00Z' },
        },
      ],
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  // Helper to wait for books to load (booksLoading becomes false)
  const waitForBooksLoaded = async () => {
    // Wait for "Your Books" section to appear (only renders after loading)
    await screen.findByRole('button', { name: /Your Books/i });
  };

  it('renders real recent activity and omits dashboard stat boxes', async () => {
    render(<DashboardPage />);

    await waitForBooksLoaded();
    expect(await screen.findByText(/Created Repair Log/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Books$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Pages$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Entries Today/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Last Sync/i)).not.toBeInTheDocument();
  });

  it('shows a create-book message when My Books is clicked with no books', async () => {
    // Override mock BEFORE render
    getBooks.mockResolvedValue({ data: [], error: null });
    render(<DashboardPage />);

    // Wait for loading to complete - check for "Your Books" button
    await waitForBooksLoaded();
    const booksCard = await screen.findByRole('button', { name: /Your Books/i });
    fireEvent.click(booksCard);

    expect(await screen.findByRole('status')).toHaveTextContent(/create a new book/i);
    expect(push).not.toHaveBeenCalledWith('/dashboard/books');
  });

  it('opens the books page when My Books is clicked with existing books', async () => {
    render(<DashboardPage />);

    await waitForBooksLoaded();
    fireEvent.click(await screen.findByRole('button', { name: /Your Books/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/books'));
  });
});
