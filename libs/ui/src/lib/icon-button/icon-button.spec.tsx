import { screen } from '@testing-library/react';
import userEvent, {
  PointerEventsCheckLevel,
} from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';
import { MdAdd } from 'react-icons/md';

import { IconButton } from './icon-button';

describe('IconButton', () => {
  it('is named by its aria-label and calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(
      <IconButton
        aria-label="Add"
        onClick={onClick}
      >
        <MdAdd />
      </IconButton>
    );

    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    const onClick = vi.fn();

    renderWithProviders(
      <IconButton
        aria-label="Add"
        onClick={onClick}
        disabled
      >
        <MdAdd />
      </IconButton>
    );

    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
