import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './page';

const { push, getBooks, signOut } = vi.hoisted(() => ({
  push: vi.fn(),
  getBooks: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'ariyo@example.com',
      display_name: 'Ariyo Quayyum',
    },
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

  it('renders real recent activity and omits dashboard stat boxes', async () => {
    render(<DashboardPage />);

    await waitFor(() => expect(getBooks).toHaveBeenCalled());
    expect(await screen.findByText(/Created Repair Log/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Books$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Pages$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Entries Today/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Last Sync/i)).not.toBeInTheDocument();
  });

  it('shows a create-book message when My Books is clicked with no books', async () => {
    getBooks.mockResolvedValue({ data: [], error: null });
    render(<DashboardPage />);

    const booksCard = await screen.findByRole('button', { name: /Your Books/i });
    fireEvent.click(booksCard);

    expect(await screen.findByRole('status')).toHaveTextContent(/create a new book/i);
    expect(push).not.toHaveBeenCalledWith('/dashboard/books');
  });

  it('opens the books page when My Books is clicked with existing books', async () => {
    render(<DashboardPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Your Books/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/books'));
  });
});
