import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BookCanvasPage from './page';

vi.mock('@/hooks/useInkEngine', () => ({
  useInkEngine: () => ({
    strokes: [],
    createStroke: vi.fn().mockReturnValue({
      id: 'stroke-1',
      points: [],
      segments: [],
      color: '#000000',
    }),
    addStroke: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: true,
    canRedo: false,
    setPenSize: vi.fn(),
    currentPenSize: 'medium',
    setPenColor: vi.fn(),
    currentColor: '#000000',
  }),
}));

vi.mock('@/components/PapyrLogo', () => ({
  PapyrLogo: () => <div data-testid="papyr-logo">Papyr</div>,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({
    id: 'test-book-id',
  }),
}));

describe('BookCanvasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the canvas element', () => {
    const { container } = render(<BookCanvasPage />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders back to books link', () => {
    render(<BookCanvasPage />);
    const backLink = screen.getByText(/Back to Books/i);
    expect(backLink).toBeInTheDocument();
  });

  it('renders Papyr title', () => {
    render(<BookCanvasPage />);
    const title = screen.getByTestId('papyr-logo');
    expect(title).toBeInTheDocument();
  });

  it('renders pen size buttons', () => {
    render(<BookCanvasPage />);
    expect(screen.getByRole('button', { name: /^extra-fine$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^fine$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^medium$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^bold$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^marker$/i })).toBeInTheDocument();
  });

  it('renders color picker input', () => {
    const { container } = render(<BookCanvasPage />);
    const colorPicker = container.querySelector('input[type="color"]');
    expect(colorPicker).toBeInTheDocument();
  });

  it('renders undo button', () => {
    render(<BookCanvasPage />);
    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toBeInTheDocument();
  });

  it('renders redo button', () => {
    render(<BookCanvasPage />);
    const redoButton = screen.getByRole('button', { name: /redo/i });
    expect(redoButton).toBeInTheDocument();
  });

  it('canvas has crosshair cursor', () => {
    const { container } = render(<BookCanvasPage />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('cursor-crosshair');
  });

  it('toolbar is positioned absolutely in top right', () => {
    const { container } = render(<BookCanvasPage />);
    const toolbar = container.querySelector('.absolute.top-3.right-3');
    expect(toolbar).toBeInTheDocument();
  });

  it('has proper header structure', () => {
    const { container } = render(<BookCanvasPage />);
    const header = container.querySelector('div[class*="fixed"][class*="top-0"]') || container.querySelector('.fixed.top-0');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('z-50');
  });

  it('color picker displays current color value', () => {
    render(<BookCanvasPage />);
    const colorValue = screen.getByText('#000000');
    expect(colorValue).toBeInTheDocument();
  });
});
