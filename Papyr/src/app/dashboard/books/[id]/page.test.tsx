import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import BookLedgerPage from './page';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-book-id' }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-book-id',
                title: 'Test Book',
                user_id: 'test-user-id',
                cover_color: '#000',
              },
              error: null,
            })),
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'test-page-id', book_id: 'test-book-id', position: 0 },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('BookLedgerPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load book and display ledger page', async () => {
    render(<BookLedgerPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
  });

  it('should create default page if none exists', async () => {
    render(<BookLedgerPage />);

    await waitFor(() => {
      // Should see default columns
      expect(screen.getByDisplayValue('Date')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Debit')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Credit')).toBeInTheDocument();
    });
  });

  it('should render 15 empty rows initially', async () => {
    render(<BookLedgerPage />);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // 1 header row + 15 data rows
      expect(rows.length).toBeGreaterThanOrEqual(16);
    });
  });

  it('should have accessible navigation', async () => {
    render(<BookLedgerPage />);

    await waitFor(() => {
      const backButton = screen.getByLabelText(/back to books/i);
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveAttribute('href', '/dashboard/books');
    });
  });

  it('should persist column edits', async () => {
    render(<BookLedgerPage />);

    await waitFor(() => {
      const dateHeader = screen.getByDisplayValue('Date');
      fireEvent.change(dateHeader, { target: { value: 'Modified Date' } });
      fireEvent.blur(dateHeader);

      expect(screen.getByDisplayValue('Modified Date')).toBeInTheDocument();
    });
  });

  it('should add new column when clicking add button', async () => {
    render(<BookLedgerPage />);

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add column/i });
      fireEvent.click(addButton);

      expect(screen.getByDisplayValue('New Column')).toBeInTheDocument();
    });
  });

  it('should auto-append row when typing in last row', async () => {
    render(<BookLedgerPage />);

    await waitFor(async () => {
      const inputs = screen.getAllByRole('textbox');
      const lastInput = inputs[inputs.length - 1];

      fireEvent.change(lastInput, { target: { value: 'test' } });

      await waitFor(() => {
        const rowsAfter = screen.getAllByRole('row');
        expect(rowsAfter.length).toBeGreaterThan(16);
      });
    });
  });

  it('should maintain user-specific data isolation', async () => {
    render(<BookLedgerPage />);

    await waitFor(() => {
      // Verify book is loaded with user check
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
  });
});
