import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { DateRangeFilter } from './dateRangeFilter';

const theme = createTheme({ cssVariables: true });

const renderFilter = (props = {}) => {
  const onChange = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <DateRangeFilter
        label="Published"
        value={{ from: null, to: null }}
        onChange={onChange}
        {...props}
      />
    </ThemeProvider>
  );
  return onChange;
};

describe('DateRangeFilter', () => {
  it('is a single field for the whole range', () => {
    renderFilter();

    expect(
      screen.getByRole('textbox', { name: 'Published' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('shows both dates it was given', () => {
    renderFilter({
      value: { from: new Date('2026-03-04'), to: new Date('2026-04-05') },
    });

    expect(screen.getByRole('textbox', { name: 'Published' })).toHaveValue(
      '04.03.2026 - 05.04.2026'
    );
  });

  it('leaves the field blank when nothing is set', () => {
    renderFilter();

    expect(screen.getByRole('textbox', { name: 'Published' })).toHaveValue('');
  });

  it('fills the column it is given', () => {
    renderFilter();

    expect(
      screen
        .getByRole('textbox', { name: 'Published' })
        .closest('.MuiFormControl-root')
    ).toHaveClass('MuiFormControl-fullWidth');
  });

  it('can be disabled', () => {
    renderFilter({ disabled: true });

    expect(screen.getByRole('textbox', { name: 'Published' })).toBeDisabled();
  });

  it('reports both ends together', () => {
    const onChange = renderFilter({
      value: { from: new Date('2026-03-04'), to: null },
    });

    fireEvent.focus(screen.getByRole('textbox', { name: 'Published' }));
    fireEvent.click(screen.getAllByText('15')[0]);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ from: expect.any(Date) })
    );
  });

  describe('presets', () => {
    const openCalendar = () =>
      fireEvent.click(screen.getByRole('textbox', { name: 'Published' }));

    const presets = [
      {
        label: 'Last week',
        value: [new Date('2026-03-01'), new Date('2026-03-08')] as const,
      },
      {
        label: 'Last month',
        value: [new Date('2026-02-08'), new Date('2026-03-08')] as const,
      },
    ];

    it('keeps them in the calendar rather than above the field', () => {
      renderFilter({ presets });

      expect(
        screen.queryByRole('button', { name: 'Last week' })
      ).not.toBeInTheDocument();
    });

    it('offers each preset', () => {
      renderFilter({ presets });
      openCalendar();

      expect(
        screen.getByRole('button', { name: 'Last week' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Last month' })
      ).toBeInTheDocument();
    });

    it('reports the whole range when a preset is picked', () => {
      const onChange = renderFilter({ presets });
      openCalendar();

      fireEvent.click(screen.getByRole('button', { name: 'Last week' }));

      expect(onChange).toHaveBeenCalledWith({
        from: new Date('2026-03-01'),
        to: new Date('2026-03-08'),
      });
    });

    it('marks the preset matching the current range', () => {
      renderFilter({
        presets,
        value: { from: new Date('2026-03-01'), to: new Date('2026-03-08') },
      });
      openCalendar();

      expect(screen.getByRole('button', { name: 'Last week' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(
        screen.getByRole('button', { name: 'Last month' })
      ).toHaveAttribute('aria-pressed', 'false');
    });

    it('closes the calendar once a preset is picked', () => {
      renderFilter({ presets });
      openCalendar();

      fireEvent.click(screen.getByRole('button', { name: 'Last week' }));

      expect(
        screen.queryByRole('button', { name: 'Last week' })
      ).not.toBeInTheDocument();
    });
  });

  it('can refuse future dates', () => {
    renderFilter({ disableFuture: true });

    fireEvent.focus(screen.getByRole('textbox', { name: 'Published' }));

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(
      screen
        .getAllByText(String(tomorrow.getDate()))
        .some(day => day.className.includes('--disabled'))
    ).toBe(true);
  });

  describe('picking a new range over an old one', () => {
    const openCalendar = () =>
      fireEvent.click(screen.getByRole('textbox', { name: 'Published' }));

    const pickDay = (day: string) =>
      fireEvent.click(
        screen
          .getAllByText(day)
          .find(node =>
            node.className.includes('react-datepicker__day')
          ) as HTMLElement
      );

    it('says nothing until both ends are picked', () => {
      const onChange = renderFilter({
        value: { from: new Date(2026, 2, 1), to: new Date(2026, 2, 8) },
      });
      openCalendar();

      pickDay('12');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('reports the new range once the second end is picked', () => {
      const onChange = renderFilter({
        value: { from: new Date(2026, 2, 1), to: new Date(2026, 2, 8) },
      });
      openCalendar();

      pickDay('12');
      pickDay('17');

      expect(onChange).toHaveBeenCalledWith({
        from: new Date(2026, 2, 12),
        to: new Date(2026, 2, 17),
      });
    });

    it('forgets a half-pick when the calendar closes', () => {
      const presets = [
        {
          label: 'Last week',
          value: [new Date(2026, 2, 1), new Date(2026, 2, 8)] as const,
        },
      ];
      renderFilter({
        presets,
        value: { from: new Date(2026, 2, 1), to: new Date(2026, 2, 8) },
      });
      openCalendar();
      pickDay('12');

      fireEvent.click(screen.getByRole('button', { name: 'Last week' }));
      openCalendar();

      expect(screen.getByRole('textbox', { name: 'Published' })).toHaveValue(
        '01.03.2026 - 08.03.2026'
      );
    });
  });
});
