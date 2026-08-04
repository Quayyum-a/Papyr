import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BooksPage from './page';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false,
    error: null,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('BooksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', async () => {
    render(<BooksPage />);
    const heading = await screen.findByRole('heading', { name: /My Books/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders search input', async () => {
    render(<BooksPage />);
    const searchInput = await screen.findByPlaceholderText(/Search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('renders All and Recent filter tabs', async () => {
    render(<BooksPage />);
    expect(await screen.findByRole('button', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recent/i })).toBeInTheDocument();
  });

  it('renders New Book button', async () => {
    render(<BooksPage />);
    const newBookButton = await screen.findByRole('button', { name: /New Book/i });
    expect(newBookButton).toBeInTheDocument();
  });

  it('displays books in grid layout', async () => {
    render(<BooksPage />);
    const bookLinks = await screen.findAllByRole('link');
    expect(bookLinks.length).toBeGreaterThan(0);
  });

  it('displays book titles', async () => {
    render(<BooksPage />);
    const bookTitle = await screen.findByText(/Repair Log: Speedy Wrench/i);
    expect(bookTitle).toBeInTheDocument();
  });

  it('shows page count for books', async () => {
    render(<BooksPage />);
    const pageCount = await screen.findByText(/45 Pages/i);
    expect(pageCount).toBeInTheDocument();
  });

  it('filters books by search query', async () => {
    render(<BooksPage />);
    const searchInput = await screen.findByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'Repair' } });
    expect(await screen.findByText(/Repair Log: Speedy Wrench/i)).toBeInTheDocument();
  });

  it('shows empty state when search returns no results', async () => {
    render(<BooksPage />);
    const searchInput = await screen.findByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(await screen.findByText(/No books found/i)).toBeInTheDocument();
  });

  it('has proper header with logo and user icon', async () => {
    render(<BooksPage />);
    const logo = await screen.findByText('Papyr');
    expect(logo).toBeInTheDocument();
  });

  it('All filter tab is active by default', async () => {
    render(<BooksPage />);
    const allButton = await screen.findByRole('button', { name: /All/i });
    expect(allButton).toHaveClass('text-gray-900');
  });
});
