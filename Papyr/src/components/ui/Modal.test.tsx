import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders children only when open', () => {
    const { rerender } = render(
      <Modal open={false} onClose={vi.fn()}>
        <p>Verification message</p>
      </Modal>
    );

    expect(screen.queryByText('Verification message')).not.toBeInTheDocument();

    rerender(
      <Modal open onClose={vi.fn()}>
        <p>Verification message</p>
      </Modal>
    );

    expect(screen.getByText('Verification message')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose}>Content</Modal>);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose}>Content</Modal>);

    fireEvent.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('uses accessible dialog semantics', () => {
    render(<Modal open onClose={vi.fn()}>Content</Modal>);

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });
});
