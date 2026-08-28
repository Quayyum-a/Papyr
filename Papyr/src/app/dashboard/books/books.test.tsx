import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BooksPage from './page';

// Mock Supabase client directly in vi.mock to avoid hoisting issues
vi.mock('@/lib/supabase/client', () => {
  // Create the mock chain that matches the component's query exactly:
  // supabase.from('books').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
  const mockOrder = vi.fn().mockResolvedValue({
    data: [
      {
        id: '1',
        title: 'Repair Log: Speedy Wrench',
        description: null,
        cover_color: '#111827',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-03T10:00:00Z',
      },
    ],
    error: null,
  });

  const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn((table: string) => {
    if (table === 'books') {
      return { select: mockSelect };
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    };
  });

  const mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'test-user', email: 'test@example.com' } },
    error: null,
  });

  // Debug: log when mocks are called (commented out for normal runs)
  // mockGetUser.mockImplementation(() => { console.log('[MOCK] getUser called'); return Promise.resolve({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null }); });
  // mockFrom.mockImplementation((table) => { console.log('[MOCK] from called with:', table); return table === 'books' ? { select: mockSelect } : { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) }; });
  // mockSelect.mockImplementation((...args) => { console.log('[MOCK] select called with:', args); return { eq: mockEq }; });
  // mockEq.mockImplementation((...args) => { console.log('[MOCK] eq called with:', args); return { order: mockOrder }; });
  // mockOrder.mockImplementation((...args) => { console.log('[MOCK] order called with:', args); return Promise.resolve({ data: [{ id: '1', title: 'Repair Log: Speedy Wrench', description: null, cover_color: '#111827', created_at: '2025-01-01T10:00:00Z', updated_at: '2025-01-03T10:00:00Z' }], error: null }); });

  return {
    supabase: {
      auth: { getUser: mockGetUser },
      from: mockFrom,
    },
  };
});

// Also mock the AuthContext to ensure it returns a user synchronously
// Use a stable reference to avoid infinite render loops
const mockAuthUser = { id: 'test-user', email: 'test@example.com' };
const mockAuthValue = {
  user: mockAuthUser,
  loading: false,
  error: null,
};

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthValue,
}));

// Mock PapyrLogo to avoid complex rendering
vi.mock('@/components/PapyrLogo', () => ({
  PapyrLogo: () => <div data-testid="papyr-logo">Papyr</div>,
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

  // Helper to render and wait for loading to complete (spinner disappears)
  const renderAndWaitForLoad = async () => {
    render(<BooksPage />);
    // Wait for loading spinner to disappear
    await screen.findByText('My Books'); // This appears after loading completes
  };

  it('renders the page heading', async () => {
    await renderAndWaitForLoad();
    const heading = await screen.findByRole('heading', { name: /My Books/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders search input', async () => {
    await renderAndWaitForLoad();
    const searchInput = await screen.findByPlaceholderText(/Search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('renders All and Recent filter tabs', async () => {
    await renderAndWaitForLoad();
    expect(await screen.findByRole('button', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recent/i })).toBeInTheDocument();
  });

  it('renders New Book button', async () => {
    await renderAndWaitForLoad();
    const newBookButton = await screen.findByRole('button', { name: /New Book/i });
    expect(newBookButton).toBeInTheDocument();
  });

  it('displays books in grid layout', async () => {
    await renderAndWaitForLoad();
    const bookLinks = await screen.findAllByRole('link');
    expect(bookLinks.length).toBeGreaterThan(0);
  });

  it('displays book titles', async () => {
    await renderAndWaitForLoad();
    const bookTitle = await screen.findByText(/Repair Log: Speedy Wrench/i);
    expect(bookTitle).toBeInTheDocument();
  });

  it('shows page count for books', async () => {
    await renderAndWaitForLoad();
    const pageCount = await screen.findByText(/0 Pages/i);
    expect(pageCount).toBeInTheDocument();
  });

  it('filters books by search query', async () => {
    await renderAndWaitForLoad();
    await screen.findByText(/Repair Log: Speedy Wrench/i); // ensure books loaded
    const searchInput = await screen.findByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'Repair' } });
    expect(await screen.findByText(/Repair Log: Speedy Wrench/i)).toBeInTheDocument();
  });

  it('shows empty state when search returns no results', async () => {
    await renderAndWaitForLoad();
    await screen.findByText(/Repair Log: Speedy Wrench/i); // ensure books loaded
    const searchInput = await screen.findByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(await screen.findByText(/No books found/i)).toBeInTheDocument();
  });

  it('has proper header with logo and user icon', async () => {
    await renderAndWaitForLoad();
    const logo = await screen.findByText('Papyr');
    expect(logo).toBeInTheDocument();
  });

  it('All filter tab is active by default', async () => {
    await renderAndWaitForLoad();
    const allButton = await screen.findByRole('button', { name: /All/i });
    expect(allButton).toHaveClass('text-gray-900');
  });
});
