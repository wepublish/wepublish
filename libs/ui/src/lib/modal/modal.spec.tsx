import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';

import { Modal, ModalProps } from './modal';

const renderModal = (props: Partial<ModalProps> = {}) => {
  const onCancel = vi.fn();
  const onSubmit = vi.fn();

  renderWithProviders(
    <Modal
      open
      title="Modal title"
      submitText="Submit Text"
      cancelText="Cancel Text"
      onCancel={onCancel}
      onSubmit={onSubmit}
      children={<p>Modal body</p>}
      {...props}
    />
  );

  return { onCancel, onSubmit };
};

describe('Modal', () => {
  it('is a modal dialog named by its title', () => {
    renderModal();

    const dialog = screen.getByRole('dialog', { name: 'Modal title' });

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(
      screen.getByRole('heading', { name: 'Modal title' })
    ).toBeInTheDocument();
  });

  it('is described by its body', () => {
    renderModal();

    expect(
      screen.getByRole('dialog', { name: 'Modal title' })
    ).toHaveAccessibleDescription('Modal body');
  });

  it('has no description without a body', () => {
    renderModal({ children: undefined });

    expect(
      screen.getByRole('dialog', { name: 'Modal title' })
    ).not.toHaveAttribute('aria-describedby');
  });

  it('has no description when its body renders nothing', () => {
    renderModal({ children: [false, null] });

    expect(
      screen.getByRole('dialog', { name: 'Modal title' })
    ).not.toHaveAttribute('aria-describedby');
  });

  it('shows its content while open', () => {
    renderModal();

    expect(screen.getByText('Modal body')).toBeInTheDocument();
  });

  it('submits without cancelling', async () => {
    const user = userEvent.setup();
    const { onCancel, onSubmit } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Submit Text' }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels without submitting', async () => {
    const user = userEvent.setup();
    const { onCancel, onSubmit } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Cancel Text' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('cancels on escape', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderModal();

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('falls back to a default cancel label', () => {
    renderModal({ cancelText: undefined });

    expect(
      screen.getByRole('button', { name: 'Abbrechen' })
    ).toBeInTheDocument();
  });

  it('renders nothing while closed', () => {
    renderModal({ open: false });

    expect(screen.queryByText('Modal body')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Submit Text' })
    ).not.toBeInTheDocument();
  });
});
