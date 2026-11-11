import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { BlockPreviewCard } from './blockPreviewCard';

const theme = createTheme({ cssVariables: true });

const renderCard = (props: Partial<Parameters<typeof BlockPreviewCard>[0]>) => {
  const onEdit = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <BlockPreviewCard
        emptyLabel="Choose poll"
        editLabel="Edit poll"
        onEdit={onEdit}
        {...props}
      />
    </ThemeProvider>
  );

  return onEdit;
};

describe('BlockPreviewCard', () => {
  it('offers the whole empty card as one labelled button', () => {
    const onEdit = renderCard({ isEmpty: true });

    fireEvent.click(screen.getByRole('button', { name: 'Choose poll' }));

    expect(onEdit).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Edit poll' })).toBeNull();
  });

  it('shows the preview with an edit button once filled', () => {
    const onEdit = renderCard({
      isEmpty: false,
      title: 'Which colour?',
      children: <p>Red or blue</p>,
    });

    expect(screen.getByText('Which colour?')).toBeInTheDocument();
    expect(screen.getByText('Red or blue')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit poll' }));

    expect(onEdit).toHaveBeenCalled();
  });

  it('disables both states of a disabled block', () => {
    renderCard({ isEmpty: true, disabled: true });

    expect(screen.getByRole('button', { name: 'Choose poll' })).toBeDisabled();
  });

  it('can sit inset inside another card', () => {
    const surfaces = createTheme({
      cssVariables: true,
      palette: { background: { default: '#111111', paper: '#222222' } },
    });

    const { container } = render(
      <ThemeProvider theme={surfaces}>
        <BlockPreviewCard
          isEmpty={false}
          inset
          emptyLabel="Choose poll"
          editLabel="Edit poll"
          onEdit={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(container.firstElementChild).toHaveStyle({
      'background-color': '#111111',
    });
  });
});
