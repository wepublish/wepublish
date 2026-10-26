import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { PlaceholderInput } from './placeholderInput';

const theme = createTheme({ cssVariables: true });

const renderInput = (disabled = false) => {
  const onAddClick = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <PlaceholderInput
        onAddClick={onAddClick}
        addLabel="Choose teaser"
        disabled={disabled}
      />
    </ThemeProvider>
  );

  return onAddClick;
};

describe('PlaceholderInput', () => {
  it('shows its label and reacts to a click anywhere on it', () => {
    const onAddClick = renderInput();

    const button = screen.getByRole('button', { name: 'Choose teaser' });

    expect(button).toHaveTextContent('Choose teaser');

    fireEvent.click(button);

    expect(onAddClick).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    renderInput(true);

    expect(
      screen.getByRole('button', { name: 'Choose teaser' })
    ).toBeDisabled();
  });

  it('renders its children once filled', () => {
    render(
      <ThemeProvider theme={theme}>
        <PlaceholderInput addLabel="Choose teaser">
          <p>Teaser</p>
        </PlaceholderInput>
      </ThemeProvider>
    );

    expect(screen.getByText('Teaser')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
