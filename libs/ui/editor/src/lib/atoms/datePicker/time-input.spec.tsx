import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { CalendarTimeInput } from './time-input';

const theme = createTheme({ cssVariables: true });

const renderInput = (value?: string) => {
  const onChange = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <CalendarTimeInput
        value={value}
        onChange={onChange}
      />
    </ThemeProvider>
  );

  return onChange;
};

const field = () => screen.getByRole('textbox', { name: 'time' });

const type = (value: string) =>
  fireEvent.change(field(), { target: { value } });

describe('CalendarTimeInput', () => {
  it('selects a filled-in time on focus, so typing replaces it', () => {
    renderInput('00:00');

    fireEvent.focus(field());

    expect((field() as HTMLInputElement).selectionStart).toBe(0);
    expect((field() as HTMLInputElement).selectionEnd).toBe(5);
  });

  it('can be labelled for a form that holds more than one time', () => {
    render(<CalendarTimeInput label="from" />);

    expect(screen.getByRole('textbox', { name: 'from' })).toBeInTheDocument();
  });

  it('is one field the user types into, not a pair of dropdowns', () => {
    renderInput();

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(field()).toBeInTheDocument();
  });

  it('drops the separator in as the hour is finished', () => {
    renderInput();

    type('0930');

    expect(field()).toHaveValue('09:30');
  });

  it('leads an hour that could not start one with a zero', () => {
    renderInput();

    type('9');

    expect(field()).toHaveValue('09');
  });

  it('pulls an hour past midnight back into range', () => {
    renderInput();

    type('25');

    expect(field()).toHaveValue('02:5');
  });

  it('pulls a minute past the hour back into range', () => {
    renderInput();

    type('097');

    expect(field()).toHaveValue('09:07');
  });

  it('ignores anything that is not a digit', () => {
    renderInput();

    type('o9:3o');

    expect(field()).toHaveValue('09:3');
  });

  it('reports a time only once the whole of it is typed', () => {
    const onChange = renderInput();

    type('093');
    expect(onChange).not.toHaveBeenCalled();

    type('0930');
    expect(onChange).toHaveBeenCalledWith('09:30');
  });

  it('lets the user delete back out through the separator', () => {
    renderInput('09:30');

    type('09:3');
    expect(field()).toHaveValue('09:3');

    type('09:');
    expect(field()).toHaveValue('09');

    type('0');
    expect(field()).toHaveValue('0');
  });

  it('follows the time it is handed', () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <CalendarTimeInput value="09:30" />
      </ThemeProvider>
    );

    expect(field()).toHaveValue('09:30');

    rerender(
      <ThemeProvider theme={theme}>
        <CalendarTimeInput value="14:45" />
      </ThemeProvider>
    );

    expect(field()).toHaveValue('14:45');
  });
});
