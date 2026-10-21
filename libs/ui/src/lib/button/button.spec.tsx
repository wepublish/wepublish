import { screen } from '@testing-library/react';
import userEvent, {
  PointerEventsCheckLevel,
} from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';
import { MdAdd } from 'react-icons/md';

import { Button } from './button';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(<Button onClick={onClick}>Click Me</Button>);

    await user.click(screen.getByRole('button', { name: 'Click Me' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    const onClick = vi.fn();

    renderWithProviders(
      <Button
        onClick={onClick}
        disabled
      >
        Click Me
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeDisabled();

    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('is contained unless another variant is given', () => {
    renderWithProviders(
      <>
        <Button>Default</Button>
        <Button variant="text">Text</Button>
      </>
    );

    expect(screen.getByRole('button', { name: 'Default' })).toHaveClass(
      'MuiButton-contained'
    );
    expect(screen.getByRole('button', { name: 'Text' })).toHaveClass(
      'MuiButton-text'
    );
  });

  it('renders the start icon inside the button', () => {
    renderWithProviders(
      <Button startIcon={<MdAdd data-testid="start-icon" />}>Add</Button>
    );

    expect(screen.getByRole('button', { name: 'Add' })).toContainElement(
      screen.getByTestId('start-icon')
    );
  });

  it('renders as a link with a target when given an href', () => {
    renderWithProviders(
      <Button
        href="https://wepublish.ch"
        target="_blank"
      >
        Visit
      </Button>
    );

    const link = screen.getByRole('link', { name: 'Visit' });
    expect(link).toHaveAttribute('href', 'https://wepublish.ch');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
