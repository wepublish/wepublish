import { createTheme } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';

import { WebsiteThemeContext } from '../website-theme';
import { ColorFieldRender } from './color.component';
import { ColorField, ColorValue } from './color.field';

const websitePalette = {
  primary: { main: '#e91e63' },
  secondary: { main: '#000000' },
  accent: { main: '#f5ff64', light: '#a4efef' },
};

const theme = createTheme(
  { palette: websitePalette },
  { palette: { tertiary: { main: '#123456' } } }
);

type HarnessProps = {
  initialValue?: ColorValue;
  field?: Partial<Omit<ColorField, 'type'>>;
  readOnly?: boolean;
  onChange: (value: ColorValue | undefined) => void;
};

const ColorFieldHarness = ({
  initialValue,
  field,
  readOnly,
  onChange,
}: HarnessProps) => {
  const [value, setValue] = useState(initialValue);

  return (
    <WebsiteThemeContext.Provider value={theme}>
      <ColorFieldRender
        id="color"
        name="color"
        field={{ type: 'color', label: 'Text', ...field }}
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

const renderField = (props: Omit<HarnessProps, 'onChange'> = {}) => {
  const onChange = vi.fn();

  render(
    <ColorFieldHarness
      {...props}
      onChange={onChange}
    />
  );

  return { onChange };
};

const openPicker = (name: string) => {
  const trigger = screen.getByRole('button', { name });

  fireEvent.click(trigger);

  return trigger;
};

const declaredStyles = (element: Element) => {
  const css = [...document.querySelectorAll('style')]
    .map(style => style.textContent)
    .join('');

  return [...element.classList]
    .flatMap(className =>
      [...css.matchAll(new RegExp(`\\.${className}\\{([^}]*)\\}`, 'g'))].map(
        ([, declarations]) => declarations
      )
    )
    .join(';');
};

describe('ColorFieldRender', () => {
  it('summarises the current colour on the trigger', () => {
    renderField({ initialValue: 'primary.main' });

    expect(
      screen.getByRole('button', { name: 'Text: Primary · Main' })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('names unset and custom colours on the trigger', () => {
    renderField();
    renderField({ initialValue: '#1a1a1a' });

    expect(screen.getByRole('button', { name: 'Text: Default' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Text: #1A1A1A' })).toBeTruthy();
  });

  it('opens on the theme tab with the current colour checked and focused', () => {
    renderField({ initialValue: 'primary.main' });
    const trigger = openPicker('Text: Primary · Main');

    const dialog = screen.getByRole('dialog', { name: 'Text' });
    const current = within(dialog).getByRole('radio', {
      name: 'Primary · Main',
    });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(within(dialog).getByRole('tab', { name: 'Theme' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(current).toHaveAttribute('aria-checked', 'true');
    expect(current).toHaveFocus();
    expect(current).toHaveAttribute('tabindex', '0');
    expect(
      within(dialog).getByRole('radio', { name: 'Primary · Light' })
    ).toHaveAttribute('tabindex', '-1');
  });

  it('picks a theme colour, closes and returns focus to the trigger', () => {
    const { onChange } = renderField({ initialValue: 'primary.main' });
    const trigger = openPicker('Text: Primary · Main');

    fireEvent.click(screen.getByRole('radio', { name: 'Accent · Light' }));

    expect(onChange).toHaveBeenCalledWith('accent.light');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAccessibleName('Text: Accent · Light');
    expect(trigger).toHaveFocus();
  });

  it('offers tenant palette additions and the fixed theme groups', () => {
    renderField();
    openPicker('Text: Default');

    expect(screen.getByRole('radio', { name: 'Default' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('radio', { name: 'Tertiary · Main' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Text · Primary' })).toBeTruthy();
    expect(
      screen.getByRole('radio', { name: 'Background · Paper' })
    ).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Common · White' })).toBeTruthy();
  });

  it('resets to the theme default', () => {
    const { onChange } = renderField({ initialValue: 'primary.main' });
    openPicker('Text: Primary · Main');

    fireEvent.click(screen.getByRole('radio', { name: 'Default' }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('moves through the swatches with the arrow keys', () => {
    const { onChange } = renderField({ initialValue: 'primary.main' });
    openPicker('Text: Primary · Main');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Primary · Main' }), {
      key: 'ArrowRight',
    });
    expect(onChange).toHaveBeenLastCalledWith('primary.light');
    expect(
      screen.getByRole('radio', { name: 'Primary · Light' })
    ).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Primary · Light' }), {
      key: 'ArrowDown',
    });
    expect(onChange).toHaveBeenLastCalledWith('secondary.light');
    expect(
      screen.getByRole('radio', { name: 'Secondary · Light' })
    ).toHaveFocus();

    fireEvent.keyDown(
      screen.getByRole('radio', { name: 'Secondary · Light' }),
      { key: 'ArrowUp' }
    );
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Primary · Light' }), {
      key: 'ArrowUp',
    });
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.getByRole('radio', { name: 'Default' })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: 'Text' })).toBeTruthy();
  });

  it('limits the swatches to the allowed colours', () => {
    renderField({ field: { colors: ['primary.main', 'tertiary.main'] } });
    openPicker('Text: Default');

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Tertiary · Main' })).toBeTruthy();
    expect(
      screen.queryByRole('radio', { name: 'Secondary · Main' })
    ).toBeNull();
  });

  it('switches to the custom tab without changing the value', () => {
    const { onChange } = renderField({ initialValue: 'primary.main' });
    openPicker('Text: Primary · Main');

    fireEvent.click(screen.getByRole('tab', { name: 'Custom' }));

    expect(screen.getByRole('tab', { name: 'Custom' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('textbox', { name: 'Hex' })).toHaveValue('#e91e63');
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('opens custom colours on the custom tab and validates the hex input', () => {
    const { onChange } = renderField({ initialValue: '#1a1a1a' });
    openPicker('Text: #1A1A1A');

    const input = screen.getByRole('textbox', { name: 'Hex' });

    expect(screen.getByRole('tab', { name: 'Custom' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(input).toHaveValue('#1a1a1a');

    fireEvent.change(input, { target: { value: 'zzz' } });
    fireEvent.blur(input);

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'Enter a hex colour such as #1A1A1A.'
    );
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '00FF00' } });

    expect(onChange).toHaveBeenLastCalledWith('#00ff00');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows the hex error in the theme error colour', () => {
    renderField({ initialValue: '#1a1a1a' });
    openPicker('Text: #1A1A1A');

    const input = screen.getByRole('textbox', { name: 'Hex' });

    fireEvent.change(input, { target: { value: 'zz' } });
    fireEvent.blur(input);

    expect(
      declaredStyles(screen.getByText('Enter a hex colour such as #1A1A1A.'))
    ).toMatch(/color:var\(--mui-palette-error-main,/);
  });

  it('steps the hue with every arrow key, ten degrees at a time with shift', () => {
    const { onChange } = renderField({ initialValue: '#ff0000' });
    openPicker('Text: #FF0000');

    const hue = screen.getByRole('slider', { name: 'Hue' });

    fireEvent.keyDown(hue, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith('#ff0400');

    fireEvent.keyDown(hue, { key: 'ArrowRight', shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith('#ff2f00');

    fireEvent.keyDown(hue, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith('#ff2a00');
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(hue).toHaveAttribute('aria-valuenow', '10');
  });

  it('steps the opacity with every arrow key, ten percent at a time with shift', () => {
    const { onChange } = renderField({ initialValue: '#ff0000' });
    openPicker('Text: #FF0000');

    const opacity = screen.getByRole('slider', { name: 'Opacity' });

    fireEvent.keyDown(opacity, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith('#ff0000fc');

    fireEvent.keyDown(opacity, { key: 'ArrowLeft', shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith('#ff0000e3');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(opacity).toHaveAttribute('aria-valuenow', '89');
  });

  it('suggests the theme colour a custom colour matches', () => {
    const { onChange } = renderField({ initialValue: '#1a1a1a' });
    openPicker('Text: #1A1A1A');

    fireEvent.change(screen.getByRole('textbox', { name: 'Hex' }), {
      target: { value: '#E91E63' },
    });

    expect(onChange).toHaveBeenLastCalledWith('#e91e63');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Matches the theme colour Primary · Main'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use theme colour' }));

    expect(onChange).toHaveBeenLastCalledWith('primary.main');
    expect(screen.getByRole('tab', { name: 'Theme' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(
      screen.getByRole('radio', { name: 'Primary · Main' })
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('hides the custom tab when custom colours are not allowed', () => {
    renderField({ field: { allowCustom: false } });
    openPicker('Text: Default');

    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Custom' })).toBeNull();
    expect(
      screen.getByRole('radiogroup', { name: 'Theme colours' })
    ).toBeTruthy();
  });

  it('closes with escape and returns focus to the trigger', () => {
    renderField({ initialValue: 'primary.main' });
    const trigger = openPicker('Text: Primary · Main');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Primary · Main' }), {
      key: 'Escape',
    });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('cannot be opened when read only', () => {
    renderField({ initialValue: 'primary.main', readOnly: true });

    expect(
      screen.getByRole('button', { name: 'Text: Primary · Main' })
    ).toBeDisabled();
  });
});
