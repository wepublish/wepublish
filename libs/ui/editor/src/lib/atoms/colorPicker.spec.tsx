import { createTheme, Dialog, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { ColorPicker } from './colorPicker';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

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

  it('tells assistive technology whether the palette is open', () => {
    renderPicker();

    const swatch = screen.getByRole('button', {
      name: 'colorPicker.pickColor',
    });

    expect(swatch).toHaveAttribute('aria-haspopup', 'dialog');
    expect(swatch).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(swatch);

    expect(swatch).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves focus into the palette when it opens', () => {
    renderPicker();

    fireEvent.click(
      screen.getByRole('button', { name: 'colorPicker.pickColor' })
    );

    expect(
      document
        .querySelector('.w-color-sketch')
        ?.contains(document.activeElement)
    ).toBe(true);
  });

  it('closes only the palette on Escape and gives focus back to the swatch', () => {
    const onClose = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <Dialog
          open
          onClose={onClose}
        >
          <ColorPicker
            value="#ff0000"
            onChange={vi.fn()}
          />
        </Dialog>
      </ThemeProvider>
    );

    const swatch = screen.getByRole('button', {
      name: 'colorPicker.pickColor',
    });
    fireEvent.click(swatch);
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });

    expect(document.querySelector('.w-color-sketch')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(swatch).toHaveFocus();
  });

  it('closes the palette on Escape from the swatch without closing the dialog', () => {
    const onClose = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <Dialog
          open
          onClose={onClose}
        >
          <ColorPicker
            value="#ff0000"
            onChange={vi.fn()}
          />
        </Dialog>
      </ThemeProvider>
    );

    const swatch = screen.getByRole('button', {
      name: 'colorPicker.pickColor',
    });
    fireEvent.click(swatch);
    fireEvent.keyDown(swatch, { key: 'Escape' });

    expect(document.querySelector('.w-color-sketch')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('labels its field', () => {
    renderPicker({ label: 'Tag colour' });

    expect(screen.getByLabelText('Tag colour')).toHaveValue('#ff0000');
  });

  it('names its swatch after the field it belongs to', () => {
    renderPicker({ label: 'Tag colour' });

    expect(
      screen.getByRole('button', {
        name: 'colorPicker.pickColorFor:{"label":"Tag colour"}',
      })
    ).toBeInTheDocument();
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
