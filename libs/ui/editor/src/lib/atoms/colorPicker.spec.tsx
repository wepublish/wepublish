import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { ColorPicker } from './colorPicker';

const theme = createTheme({ cssVariables: true });

const renderPicker = (props = {}) => {
  const onChange = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <ColorPicker
        value="#ff0000"
        onChange={onChange}
        {...props}
      />
    </ThemeProvider>
  );

  return onChange;
};

describe('ColorPicker', () => {
  it('shows the colour it was given', () => {
    renderPicker();

    expect(screen.getByDisplayValue('#ff0000')).toBeInTheDocument();
  });

  it('reports a colour typed into the field', () => {
    const onChange = renderPicker();

    fireEvent.change(screen.getByDisplayValue('#ff0000'), {
      target: { value: '#00ff00' },
    });

    expect(onChange).toHaveBeenCalled();
  });

  it('wears the colour on its swatch', () => {
    renderPicker();

    expect(screen.getByRole('button')).toHaveStyle({
      backgroundColor: '#ff0000',
    });
  });

  it('keeps the palette shut until the swatch is clicked', () => {
    renderPicker();

    expect(screen.queryByTitle(/hex/i)).not.toBeInTheDocument();
    expect(document.querySelector('.w-color-sketch')).toBeNull();
  });

  it('opens the palette from the swatch', () => {
    renderPicker();

    fireEvent.click(screen.getByRole('button'));

    expect(document.querySelector('.w-color-sketch')).toBeInTheDocument();
  });

  it('leaves the palette shut while disabled', () => {
    renderPicker({ disabled: true });

    fireEvent.click(screen.getByRole('button'));

    expect(document.querySelector('.w-color-sketch')).toBeNull();
    expect(screen.getByDisplayValue('#ff0000')).toBeDisabled();
  });

  it('offers the colours it was handed as presets', () => {
    renderPicker({ presetColors: ['#123456'] });

    fireEvent.click(screen.getByRole('button'));

    const swatches = document.querySelector('.w-color-swatch');

    expect(swatches?.querySelectorAll('[title]')).toHaveLength(1);
    expect(swatches?.querySelector('[title="#123456"]')).toBeInTheDocument();
  });

  it('labels its field', () => {
    renderPicker({ label: 'Tag colour' });

    expect(screen.getByLabelText('Tag colour')).toHaveValue('#ff0000');
  });

  it('shows the error instead of the helper text', () => {
    renderPicker({
      helperText: 'Pick something',
      error: { type: 'validate', message: 'Not a colour' },
    });

    expect(screen.getByText('Not a colour')).toBeInTheDocument();
    expect(screen.queryByText('Pick something')).not.toBeInTheDocument();
  });
});
