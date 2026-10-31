import { createTheme } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';

import { WebsiteThemeContext } from '../website-theme';
import { PaletteFieldRender } from './palette.component';
import { PaletteField, PaletteValue } from './palette.field';

const websitePalette = {
  primary: { main: '#e91e63' },
  secondary: { main: '#000000' },
  accent: { main: '#f5ff64' },
};

const theme = createTheme({ palette: websitePalette });

type HarnessProps = {
  initialValue: PaletteValue;
  field?: Partial<Omit<PaletteField, 'type'>>;
  readOnly?: boolean;
  onChange: (value: PaletteValue) => void;
};

const PaletteFieldHarness = ({
  initialValue,
  field,
  readOnly,
  onChange,
}: HarnessProps) => {
  const [value, setValue] = useState(initialValue);

  return (
    <WebsiteThemeContext.Provider value={theme}>
      <PaletteFieldRender
        id="palette"
        name="palette"
        field={{ type: 'palette', label: 'Colour', ...field }}
        value={value}
        readOnly={readOnly}
        onChange={next => {
          setValue(next);
          onChange(next);
        }}
      />
    </WebsiteThemeContext.Provider>
  );
};

const renderField = (props: Omit<HarnessProps, 'onChange'>) => {
  const onChange = vi.fn();

  render(
    <PaletteFieldHarness
      {...props}
      onChange={onChange}
    />
  );

  return { onChange };
};

describe('PaletteFieldRender', () => {
  it('only offers the palettes configured on the field', () => {
    renderField({
      initialValue: 'primary',
      field: { palettes: ['primary', 'accent'] },
    });

    const group = screen.getByRole('radiogroup', { name: 'Colour' });

    expect(within(group).getAllByRole('radio')).toHaveLength(2);
    expect(
      within(group).getByRole('radio', { name: 'Primary' })
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      within(group).queryByRole('radio', { name: 'Secondary' })
    ).toBeNull();
  });

  it('offers every palette by default', () => {
    renderField({ initialValue: 'primary' });

    expect(screen.getAllByRole('radio')).toHaveLength(7);
  });

  it('selects a palette by click', () => {
    const { onChange } = renderField({ initialValue: 'primary' });

    fireEvent.click(screen.getByRole('radio', { name: 'Accent' }));

    expect(onChange).toHaveBeenCalledWith('accent');
    expect(screen.getByRole('radio', { name: 'Accent' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('moves the selection with the arrow keys and keeps one tab stop', () => {
    const { onChange } = renderField({ initialValue: 'primary' });
    const primary = screen.getByRole('radio', { name: 'Primary' });

    expect(primary).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'Secondary' })).toHaveAttribute(
      'tabindex',
      '-1'
    );

    fireEvent.keyDown(primary, { key: 'ArrowRight' });

    expect(onChange).toHaveBeenLastCalledWith('secondary');
    expect(screen.getByRole('radio', { name: 'Secondary' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Secondary' }), {
      key: 'ArrowLeft',
    });
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Primary' }), {
      key: 'ArrowLeft',
    });

    expect(onChange).toHaveBeenLastCalledWith('warning');
  });

  it('ignores input when read only', () => {
    const { onChange } = renderField({
      initialValue: 'primary',
      readOnly: true,
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Accent' }));
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Primary' }), {
      key: 'ArrowRight',
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Primary' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });
});
