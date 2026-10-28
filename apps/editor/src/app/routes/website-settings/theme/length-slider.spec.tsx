import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ChangeEvent, useState } from 'react';
import { FieldError } from 'react-hook-form';

import { LengthSlider, UnitConfig } from './length-slider';

const unitConfig: UnitConfig = {
  em: { min: -0.1, max: 0.2, step: 0.005 },
  rem: { min: 0.5, max: 6.5, step: 0.05 },
  px: { min: -2, max: 5, step: 0.2 },
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const helperText = 'Helper';

let changes: string[] = [];

const Controlled = ({
  initial,
  error,
}: {
  initial?: string | null;
  error?: FieldError;
}) => {
  const [value, setValue] = useState<string | null | undefined>(initial);

  return (
    <LengthSlider
      name="letterSpacing"
      value={value}
      defaultUnit="em"
      unitConfig={unitConfig}
      label="Letter spacing"
      unitLabel="Unit of letter spacing"
      describedBy="helper"
      error={error}
      onBlur={() => undefined}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        changes.push(event.target.value);
        setValue(event.target.value);
      }}
    />
  );
};

const renderSlider = (initial?: string | null, error?: FieldError) => {
  changes = [];

  return render(
    <ThemeProvider theme={createTheme()}>
      <span id="helper">{helperText}</span>
      <Controlled
        initial={initial}
        error={error}
      />
    </ThemeProvider>
  );
};

const input = () => screen.getByRole('spinbutton', { name: 'Letter spacing' });

const selectUnit = (unit: string) => {
  fireEvent.mouseDown(
    screen.getByRole('combobox', { name: 'Unit of letter spacing' })
  );
  fireEvent.click(screen.getByRole('option', { name: unit }));
};

describe('LengthSlider', () => {
  it('keeps partial input while typing', () => {
    renderSlider('0.1em');

    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: '0.' } });

    expect(input()).toHaveValue('0.');

    fireEvent.change(input(), { target: { value: '0.5' } });

    expect(input()).toHaveValue('0.5');
    expect(changes.at(-1)).toBe('0.5em');
  });

  it('does not report input that is not a number yet', () => {
    renderSlider('0.1em');

    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: '-' } });

    expect(input()).toHaveValue('-');
    expect(changes).toEqual([]);
  });

  it('shows the formatted value again after leaving the field', () => {
    renderSlider('0.1em');

    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: '0.050' } });
    fireEvent.blur(input());

    expect(input()).toHaveValue('0.05');
  });

  it('shows an empty value as not set instead of 0', () => {
    renderSlider(null);

    expect(input()).toHaveValue('');
    expect(input()).toHaveAttribute(
      'placeholder',
      'websiteSettings.theme.typography.notSet'
    );
    expect(input()).not.toHaveAttribute('aria-valuenow');
    expect(input()).toHaveAttribute(
      'aria-valuetext',
      'websiteSettings.theme.typography.notSet'
    );
    expect(
      screen.getByRole('slider', { name: 'Letter spacing' })
    ).toHaveAttribute(
      'aria-valuetext',
      'websiteSettings.theme.typography.notSet'
    );
    expect(changes).toEqual([]);
  });

  it('clamps a typed value into the range of the unit when leaving the field', () => {
    renderSlider('0.1em');

    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: '9' } });
    fireEvent.blur(input());

    expect(changes.at(-1)).toBe('0.2em');
    expect(input()).toHaveValue('0.2');
  });

  it('does not change the value with the arrow keys of the unit select', () => {
    renderSlider('0.1em');

    const unit = screen.getByRole('combobox', {
      name: 'Unit of letter spacing',
    });

    fireEvent.keyDown(unit, { key: 'ArrowDown' });
    const option = screen.getByRole('option', { name: 'em' });
    fireEvent.keyDown(option, { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('option', { name: 'rem' }), {
      key: 'ArrowUp',
    });

    expect(changes).toEqual([]);

    fireEvent.click(screen.getByRole('option', { name: 'px' }));

    expect(changes).toEqual(['1.6px']);
  });

  it('shows and announces the validation message', () => {
    renderSlider('0.1em', {
      type: 'custom',
      message: 'Value must be between -0.1em and 0.2em.',
    });

    expect(
      screen.getByText('Value must be between -0.1em and 0.2em.')
    ).toBeVisible();
    expect(input()).toHaveAccessibleDescription(
      'Helper Value must be between -0.1em and 0.2em.'
    );
    expect(
      screen.getByRole('slider', { name: 'Letter spacing' })
    ).toHaveAccessibleDescription(
      'Helper Value must be between -0.1em and 0.2em.'
    );
  });

  it('steps with the arrow keys and ten steps with shift', () => {
    renderSlider('0.1em');

    fireEvent.keyDown(input(), { key: 'ArrowUp' });
    expect(changes.at(-1)).toBe('0.105em');

    fireEvent.keyDown(input(), { key: 'ArrowDown', shiftKey: true });
    expect(changes.at(-1)).toBe('0.055em');
    expect(input()).toHaveValue('0.055');
  });

  it('keeps arrow key steps inside the range of the unit', () => {
    renderSlider('0.19em');

    fireEvent.keyDown(input(), { key: 'ArrowUp', shiftKey: true });
    expect(changes.at(-1)).toBe('0.2em');

    fireEvent.keyDown(input(), { key: 'ArrowUp' });
    expect(changes.at(-1)).toBe('0.2em');
  });

  it('converts and clamps the value when switching the unit', () => {
    renderSlider('0.1em');

    selectUnit('px');
    expect(changes.at(-1)).toBe('1.6px');

    selectUnit('rem');
    expect(changes.at(-1)).toBe('0.5rem');
  });

  it('shows the unit select inside the outline of the number field', () => {
    const { container } = renderSlider('0.1em');

    const outlines = container.querySelectorAll('.MuiOutlinedInput-root');

    expect(outlines).toHaveLength(1);
    expect(within(outlines[0] as HTMLElement).getByRole('spinbutton')).toBe(
      input()
    );
    expect(
      within(outlines[0] as HTMLElement).getByRole('combobox', {
        name: 'Unit of letter spacing',
      })
    ).toBeInTheDocument();
  });

  it('has no labels under the ends of the slider', () => {
    const { container } = renderSlider('0.1em');

    expect(container.querySelectorAll('.MuiSlider-markLabel')).toHaveLength(0);
    expect(screen.queryByText('-0.1em')).not.toBeInTheDocument();
    expect(screen.queryByText('0.2em')).not.toBeInTheDocument();
  });

  it('names and describes the slider, the field and the unit', () => {
    renderSlider('0.1em');

    expect(
      screen.getByRole('slider', { name: 'Letter spacing' })
    ).toHaveAccessibleDescription('Helper');
    expect(input()).toHaveAccessibleDescription('Helper');
    expect(
      screen.getByRole('combobox', { name: 'Unit of letter spacing' })
    ).toBeInTheDocument();
  });

  it('follows outside changes while the field is not being edited', () => {
    renderSlider('0.1em');

    fireEvent.change(screen.getByRole('slider', { name: 'Letter spacing' }), {
      target: { value: 0.15 },
    });

    expect(input()).toHaveValue('0.15');
  });
});
