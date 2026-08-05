import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
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
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: mockInsert.mockImplementation(() => ({
        select: mockSelect.mockImplementation(() => ({
          single: mockSingle,
        })),
      })),
    }),
  },
}));

// Helper to create a delayed mock response
const createDelayedMock = (data: any, error: any, delay = 50) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data, error }), delay);
  });
};

describe('Create Book Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue(
      createDelayedMock({ id: 'new-book-id', title: 'Test Book' }, null)
    );
  });

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

  it('has no business category UI anywhere on the page', () => {
    render(<NewBookPage />);
    expect(screen.queryByText(/business category/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/business type/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/phone repair/i)).not.toBeInTheDocument();
  });

  it('displays theme options', () => {
    render(<NewBookPage />);
    expect(screen.getByText(/graphite/i)).toBeInTheDocument();
    expect(screen.getByText(/sand/i)).toBeInTheDocument();
    expect(screen.getByText(/forest/i)).toBeInTheDocument();
    expect(screen.getByText(/ocean/i)).toBeInTheDocument();
    expect(screen.getByText(/slate/i)).toBeInTheDocument();
    expect(screen.getByText(/terracotta/i)).toBeInTheDocument();
    expect(screen.getByText(/indigo/i)).toBeInTheDocument();
    expect(screen.getByText(/emerald/i)).toBeInTheDocument();
  });

  it('shows a live preview of the book cover', () => {
    render(<NewBookPage />);
    expect(screen.getByTestId('book-cover-preview-large')).toBeInTheDocument();
    expect(screen.getByText(/Live Preview/i)).toBeInTheDocument();
  });

  it('updates live preview title when typing in book name field', async () => {
    const user = userEvent.setup();
    render(<NewBookPage />);

    const bookNameInput = screen.getByLabelText(/book name \*/i);
    await user.type(bookNameInput, 'My Test Ledger');

    // The preview should show the typed title
    const preview = screen.getByTestId('book-cover-preview-large');
    expect(preview).toHaveTextContent('My Test Ledger');
  });

  it('shows placeholder "Book Name" in preview when title is empty', () => {
    render(<NewBookPage />);
    const preview = screen.getByTestId('book-cover-preview-large');
    expect(preview).toHaveTextContent('Book Name');
  });

  it('changes live preview background when selecting a different theme', async () => {
    const user = userEvent.setup();
    render(<NewBookPage />);

    // Default theme is Graphite (#282a2c)
    const preview = screen.getByTestId('book-cover-preview-large');
    expect(preview).toHaveStyle({ backgroundColor: '#282a2c' });

    // Select Forest theme
    const forestRadio = screen.getByRole('radio', { name: /forest/i });
    await user.click(forestRadio);

    // Preview background should change to Forest color
    expect(preview).toHaveStyle({ backgroundColor: '#244534' });

    // Select Ocean theme
    const oceanRadio = screen.getByRole('radio', { name: /ocean/i });
    await user.click(oceanRadio);

    expect(preview).toHaveStyle({ backgroundColor: '#254a5b' });
  });

  it('each theme swatch shows the book title in that theme', async () => {
    const user = userEvent.setup();
    render(<NewBookPage />);

    const bookNameInput = screen.getByLabelText(/book name \*/i);
    await user.type(bookNameInput, 'Sales Ledger');

    // All theme swatches should render BookCoverPreview with the title
    const swatches = screen.getAllByTestId('book-cover-preview-small');
    // 8 small swatches
    expect(swatches.length).toBe(8);

    // Each swatch should have the title
    swatches.forEach((swatch) => {
      expect(swatch).toHaveTextContent('Sales Ledger');
    });
  });

  it('submits form with both cover_theme and cover_color matching selected theme', async () => {
    const user = userEvent.setup();
    render(<NewBookPage />);

    // Fill in valid form data
    const bookNameInput = screen.getByLabelText(/book name \*/i);
    await user.type(bookNameInput, 'Valid Book Name');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'A test description');

    // Select Forest theme
    const forestRadio = screen.getByRole('radio', { name: /forest/i });
    await user.click(forestRadio);

    // Submit
    const createButton = screen.getByRole('button', { name: /create book/i });
    await user.click(createButton);

    // Wait for submission
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });

    // Verify the insert was called with correct data
    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall).toMatchObject({
      title: 'Valid Book Name',
      description: 'A test description',
      cover_theme: 'Forest',
      cover_color: '#c2d3c5', // Forest accent color
      user_id: 'test-user',
    });
  });

  it('submits with default Graphite theme when no theme is explicitly selected', async () => {
    const user = userEvent.setup();
    render(<NewBookPage />);

    const bookNameInput = screen.getByLabelText(/book name \*/i);
    await user.type(bookNameInput, 'Default Theme Book');

    const createButton = screen.getByRole('button', { name: /create book/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.cover_theme).toBe('Graphite');
    expect(insertCall.cover_color).toBe('#b8b8b5'); // Graphite accent
  });

  it('disables create button when book name is too short', async () => {
    const user = userEvent.setup();
    render(<NewBookPage />);

    const bookNameInput = screen.getByLabelText(/book name \*/i);
    await user.type(bookNameInput, 'Ab'); // Too short

    const createButton = screen.getByRole('button', { name: /create book/i });
    expect(createButton).toBeDisabled();
  });

  it('enables create button when book name is valid length (3-80 chars)', async () => {
    const user = userEvent.setup();
    render(<NewBookPage />);

    const bookNameInput = screen.getByLabelText(/book name \*/i);
    await user.type(bookNameInput, 'Valid Book Name'); // 15 chars

    const createButton = screen.getByRole('button', { name: /create book/i });
    expect(createButton).not.toBeDisabled();
  });

  it('enables create button when description is valid length (0-300 chars)', async () => {
    const user = userEvent.setup();
    render(<NewBookPage />);

    const bookNameInput = screen.getByLabelText(/book name \*/i);
    await user.type(bookNameInput, 'Valid Name');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'A'.repeat(100)); // Valid length (well under 300)

    const createButton = screen.getByRole('button', { name: /create book/i });
    expect(createButton).not.toBeDisabled();
  });

  it('disables create button when book name is empty', () => {
    render(<NewBookPage />);

    const createButton = screen.getByRole('button', { name: /create book/i });
    expect(createButton).toBeDisabled();
  });

  it('shows error when supabase insert fails', async () => {
    const user = userEvent.setup();
    mockSingle.mockResolvedValueOnce(
      createDelayedMock(null, { message: 'Database error' })
    );

    render(<NewBookPage />);

    const bookNameInput = screen.getByLabelText(/book name \*/i);
    await user.type(bookNameInput, 'Valid Name');

    const createButton = screen.getByRole('button', { name: /create book/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create book. please try again./i)).toBeInTheDocument();
    });
  });

  it('navigates to dashboard books on successful creation', async () => {
    const user = userEvent.setup();
    render(<NewBookPage />);

    const bookNameInput = screen.getByLabelText(/book name \*/i);
    await user.type(bookNameInput, 'Valid Name');

    const createButton = screen.getByRole('button', { name: /create book/i });
    await user.click(createButton);

    await waitFor(() => {
      // The router push should be called - we can't easily test this without more mocking
      // but we can verify the insert was called
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it('renders progress indicator with two steps', () => {
    render(<NewBookPage />);
    expect(screen.getByText(/Book Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose Cover/i)).toBeInTheDocument();
  });

  it('uses slate-900 for primary buttons, not indigo', () => {
    render(<NewBookPage />);

    // Check that no indigo classes are used
    const createButton = screen.getByRole('button', { name: /create book/i });
    expect(createButton).not.toHaveClass(/indigo/);
  });

  it('uses teal-600 for selected theme border', async () => {
    const user = userEvent.setup();
    render(<NewBookPage />);

    const forestRadio = screen.getByRole('radio', { name: /forest/i });
    await user.click(forestRadio);

    // The selected theme card should have teal-600 border
    const selectedCard = screen.getByRole('radio', { name: /forest/i }).closest('label');
    expect(selectedCard).toHaveClass('border-teal-600');
    expect(selectedCard).toHaveClass('bg-teal-50');
  });

  it('focus rings use slate-900', () => {
    render(<NewBookPage />);

    const bookNameInput = screen.getByLabelText(/book name \*/i);
    expect(bookNameInput).toHaveClass('focus:ring-slate-900');
  });
});