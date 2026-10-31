import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Weekday } from '@wepublish/editor/api';
import i18next from 'i18next';
import { useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { WebsiteThemeContext } from '../website-theme';
import { BlockVisibilityFieldRender } from './block-visibility.component';
import {
  BlockVisibilityField,
  BlockVisibilityValue,
} from './block-visibility.field';

const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        blockTiming: {
          title: 'Schedule this block',
          summary: {
            always: 'Always shows.',
            shows: 'Shows {{conditions}}.',
            days: 'on {{days}}',
          },
        },
        weekdayRecurring: { Monday: 'Mondays' },
      },
    },
  },
  initImmediate: false,
  interpolation: { escapeValue: false },
});

const theme = createTheme({ cssVariables: true });

type HarnessProps = {
  initialValue?: BlockVisibilityValue;
  field?: Partial<Omit<BlockVisibilityField, 'type'>>;
  readOnly?: boolean;
  onChange: (value: BlockVisibilityValue | undefined) => void;
};

const BlockVisibilityHarness = ({
  initialValue,
  field,
  readOnly,
  onChange,
}: HarnessProps) => {
  const [value, setValue] = useState(initialValue);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <WebsiteThemeContext.Provider value={theme}>
          <BlockVisibilityFieldRender
            id="visibility"
            name="visibility"
            field={{ type: 'blockVisibility', label: 'Visibility', ...field }}
            value={value}
            readOnly={readOnly}
            onChange={next => {
              setValue(next);
              onChange(next);
            }}
          />
        </WebsiteThemeContext.Provider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

const renderField = (props: Omit<HarnessProps, 'onChange'> = {}) => {
  const onChange = vi.fn();

  render(
    <BlockVisibilityHarness
      {...props}
      onChange={onChange}
    />
  );

  return { onChange };
};

const section = (name: string) => screen.getByRole('group', { name });

describe('BlockVisibilityFieldRender', () => {
  it('splits the field into status, schedule and screen sizes', () => {
    renderField();

    const field = screen.getByRole('group', { name: 'Visibility' });

    expect(within(field).getByRole('group', { name: 'Status' })).toBeTruthy();
    expect(within(field).getByRole('group', { name: 'Schedule' })).toBeTruthy();
    expect(
      within(field).getByRole('group', { name: 'Screen sizes' })
    ).toBeTruthy();
  });

  it('names the field after its label', () => {
    renderField({ field: { label: 'Display' } });

    expect(screen.getByRole('group', { name: 'Display' })).toBeTruthy();
  });

  it('describes each section and its current state', () => {
    renderField();

    expect(section('Status')).toHaveAccessibleDescription(
      'Hide the block without removing it from the page. Shown wherever the schedule and screen sizes allow'
    );
    expect(section('Schedule')).toHaveAccessibleDescription(
      'Limit the block to certain dates, weekdays or times of day. Always shows.'
    );
    expect(section('Screen sizes')).toHaveAccessibleDescription(
      'Pick the screen sizes the block appears on. Shown on all screen sizes'
    );
  });

  it('hides the block everywhere and shows it again', () => {
    const { onChange } = renderField();
    const status = within(section('Status'));

    expect(
      (status.getByRole('radio', { name: 'Visible' }) as HTMLInputElement)
        .checked
    ).toBe(true);
    expect(status.getByRole('radiogroup', { name: 'Status' })).toBeTruthy();

    fireEvent.click(status.getByRole('radio', { name: 'Hidden' }));

    expect(onChange).toHaveBeenLastCalledWith({ disabled: true });
    expect(
      status.getByText('Hidden everywhere — still kept on the page')
    ).toBeTruthy();

    fireEvent.click(status.getByRole('radio', { name: 'Visible' }));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('keeps the other settings when the status changes', () => {
    const { onChange } = renderField({ initialValue: { breakpoints: ['xs'] } });

    fireEvent.click(
      within(section('Status')).getByRole('radio', { name: 'Hidden' })
    );

    expect(onChange).toHaveBeenLastCalledWith({
      disabled: true,
      breakpoints: ['xs'],
    });
  });

  it('summarises the schedule and opens it for editing', () => {
    renderField({ initialValue: { timings: { weekdays: [Weekday.Monday] } } });

    const schedule = within(section('Schedule'));

    expect(schedule.getByText('Shows on Mondays.')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(schedule.getByRole('button', { name: 'Edit schedule' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('stores a schedule picked in the window', () => {
    const { onChange } = renderField();

    fireEvent.click(
      within(section('Schedule')).getByRole('button', {
        name: 'Edit schedule',
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'weekday.Monday' }));

    expect(onChange).toHaveBeenLastCalledWith({
      timings: { weekdays: [Weekday.Monday] },
    });
  });

  it('clears a schedule without touching the rest', () => {
    const { onChange } = renderField({
      initialValue: { disabled: true, timings: { weekdays: [Weekday.Monday] } },
    });

    const schedule = within(section('Schedule'));

    fireEvent.click(schedule.getByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenLastCalledWith({ disabled: true });
    expect(schedule.getByText('Always shows.')).toBeTruthy();
    expect(schedule.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('keeps focus in the schedule section once the schedule is cleared', () => {
    renderField({ initialValue: { timings: { weekdays: [Weekday.Monday] } } });

    const schedule = within(section('Schedule'));
    const clear = schedule.getByRole('button', { name: 'Clear' });

    clear.focus();
    fireEvent.click(clear);

    expect(schedule.queryByRole('button', { name: 'Clear' })).toBeNull();
    expect(
      schedule.getByRole('button', { name: 'Edit schedule' })
    ).toHaveFocus();
  });

  it('offers no clear button without a schedule', () => {
    renderField();

    expect(
      within(section('Schedule')).queryByRole('button', { name: 'Clear' })
    ).toBeNull();
  });

  it('limits the block to screen sizes and shows it on all again', () => {
    const { onChange } = renderField();
    const sizes = within(section('Screen sizes'));

    fireEvent.click(sizes.getByRole('checkbox', { name: 'md · 900–1199px' }));

    expect(onChange).toHaveBeenLastCalledWith({
      breakpoints: ['xs', 'sm', 'lg', 'xl'],
    });
    expect(sizes.getByText('Hidden on md')).toBeTruthy();

    fireEvent.click(sizes.getByRole('button', { name: 'All sizes' }));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(sizes.getByText('Shown on all screen sizes')).toBeTruthy();
  });

  it('keeps focus in the screen sizes section once all sizes are shown', () => {
    renderField({ initialValue: { breakpoints: ['xs'] } });

    const sizes = within(section('Screen sizes'));
    const showAll = sizes.getByRole('button', { name: 'All sizes' });

    showAll.focus();
    fireEvent.click(showAll);

    expect(sizes.queryByRole('button', { name: 'All sizes' })).toBeNull();
    expect(sizes.getByRole('checkbox', { name: 'xs · 0–599px' })).toHaveFocus();
  });

  it('cannot be changed while read only', () => {
    renderField({
      readOnly: true,
      initialValue: {
        timings: { weekdays: [Weekday.Monday] },
        breakpoints: ['xs'],
      },
    });

    expect(
      screen
        .getAllByRole('radio')
        .every(input => (input as HTMLInputElement).disabled)
    ).toBe(true);
    expect(
      screen
        .getAllByRole('checkbox')
        .every(input => (input as HTMLInputElement).disabled)
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Edit schedule' })
    ).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'All sizes' })).toBeNull();
  });
});
