import { createTheme, Dialog, ThemeProvider } from '@mui/material';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { DateTimePicker } from './dateTimePicker';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.hour ? `${key}:${options.hour}` : key,
  }),
}));

const renderPicker = (props: Partial<Parameters<typeof DateTimePicker>[0]>) => {
  const changeDate = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <DateTimePicker
        label="Starts at"
        dateTime={undefined}
        changeDate={changeDate}
        {...props}
      />
    </ThemeProvider>
  );

  return changeDate;
};

const openCalendar = () =>
  fireEvent.focus(screen.getByRole('textbox', { name: 'Starts at' }));

describe('DateTimePicker', () => {
  it('hands its input to the inputRef so a form can focus it', () => {
    const inputRef = createRef<HTMLInputElement>();

    renderPicker({ inputRef });

    expect(inputRef.current).toBe(
      screen.getByRole('textbox', { name: 'Starts at' })
    );
  });

  it('sets the clock without moving the day', () => {
    const changeDate = renderPicker({
      dateTime: new Date('2026-03-04T09:30:00'),
    });

    openCalendar();
    fireEvent.click(screen.getByRole('button', { name: 'dateTimePicker.now' }));

    const picked = changeDate.mock.calls.at(-1)?.[0] as Date;
    expect(picked.getDate()).toBe(4);
    expect(picked.getHours()).toBe(new Date().getHours());
  });

  it('keeps its shortcuts in the calendar rather than above the field', () => {
    renderPicker({});

    expect(
      screen.queryByRole('button', { name: 'dateTimePicker.today' })
    ).not.toBeInTheDocument();

    openCalendar();

    expect(
      screen.getByRole('button', { name: 'dateTimePicker.today' })
    ).toBeInTheDocument();
  });

  it('reports the date a shortcut picked', () => {
    const changeDate = renderPicker({});

    openCalendar();
    fireEvent.click(
      screen.getByRole('button', { name: 'dateTimePicker.today' })
    );

    const picked = changeDate.mock.calls.at(-1)?.[0] as Date;
    expect(picked.toDateString()).toBe(new Date().toDateString());
  });

  it('keeps the chosen time when a day shortcut moves the date', () => {
    const changeDate = renderPicker({
      dateTime: new Date('2026-03-04T09:30:00'),
    });

    openCalendar();
    fireEvent.click(
      screen.getByRole('button', { name: 'dateTimePicker.today' })
    );

    const picked = changeDate.mock.calls.at(-1)?.[0] as Date;
    expect(picked.toDateString()).toBe(new Date().toDateString());
    expect(picked.getHours()).toBe(9);
    expect(picked.getMinutes()).toBe(30);
  });

  it('opens the calendar inside the dialog it sits in', () => {
    render(
      <ThemeProvider theme={theme}>
        <Dialog open>
          <DateTimePicker
            label="Starts at"
            dateTime={undefined}
            changeDate={vi.fn()}
          />
        </Dialog>
      </ThemeProvider>
    );

    openCalendar();

    expect(
      screen
        .getByRole('textbox', { name: 'time' })
        .closest('.MuiDialog-container')
    ).not.toBeNull();
  });

  it('shows information below the field without marking it invalid', () => {
    renderPicker({ helpInfo: 'First published on 24.10.2026' });

    expect(screen.getByRole('textbox', { name: 'Starts at' })).toHaveAttribute(
      'aria-invalid',
      'false'
    );
    expect(screen.getByText('First published on 24.10.2026')).not.toHaveClass(
      'Mui-error'
    );
  });

  it('marks the field invalid only when told it is in error', () => {
    renderPicker({ helperText: 'Required', error: true });

    expect(screen.getByRole('textbox', { name: 'Starts at' })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('keeps information passed as helper text neutral when there is no error', () => {
    renderPicker({ helperText: 'First published on 24.10.2026', error: false });

    expect(screen.getByRole('textbox', { name: 'Starts at' })).toHaveAttribute(
      'aria-invalid',
      'false'
    );
  });

  it('keeps the focus on the time input instead of the selected day', () => {
    renderPicker({ dateTime: new Date('2026-03-04T09:30:00') });

    const field = screen.getByRole('textbox', { name: 'Starts at' });
    act(() => field.focus());

    const time = screen.getByRole('textbox', { name: 'time' });
    fireEvent.mouseDown(time);

    expect(time).toHaveFocus();
  });
});
