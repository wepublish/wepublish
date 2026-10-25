import { IconButton } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { IconButtonTooltip } from './iconButtonTooltip';

const renderTooltip = (onClick = vi.fn()) => {
  render(
    <IconButtonTooltip caption="Delete">
      <IconButton
        aria-label="Delete"
        onClick={onClick}
      >
        x
      </IconButton>
    </IconButtonTooltip>
  );

  return { button: screen.getByRole('button', { name: 'Delete' }), onClick };
};

describe('IconButtonTooltip', () => {
  it('renders the button it wraps', () => {
    const { button } = renderTooltip();

    expect(button).toBeInTheDocument();
  });

  it('passes clicks through to the button', () => {
    const { button, onClick } = renderTooltip();

    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it('draws no tooltip until the pointer arrives', () => {
    const { button } = renderTooltip();

    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('keeps the visible text as the name of a labelled button it describes', async () => {
    render(
      <IconButtonTooltip
        caption="No active peering"
        describeChild
      >
        <button type="button">Connect</button>
      </IconButtonTooltip>
    );

    const button = screen.getByRole('button', { name: 'Connect' });
    fireEvent.mouseOver(button);
    await screen.findByRole('tooltip');

    expect(button).toHaveAccessibleName('Connect');
    expect(button).toHaveAccessibleDescription('No active peering');
  });

  it('shows the caption on hover', async () => {
    const { button } = renderTooltip();

    fireEvent.mouseOver(button);

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Delete');
  });

  it('hides it again when the pointer leaves', async () => {
    const { button } = renderTooltip();

    fireEvent.mouseOver(button);
    await screen.findByRole('tooltip');
    fireEvent.mouseLeave(button);

    await vi.waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    );
  });
});
