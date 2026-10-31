import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { BlockTimingInput, Weekday } from '@wepublish/editor/api';
import { ReactNode } from 'react';

import {
  BlockTimingButton,
  dateRangeOf,
  describeTiming,
  timingDateRange,
} from './blockTiming';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

const renderButton = (
  timing: BlockTimingInput | null | undefined,
  onChange = vi.fn()
) => {
  render(
    <BlockTimingButton
      timing={timing}
      onChange={onChange}
    />,
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      ),
    }
  );

  return onChange;
};

const button = () =>
  screen.getByRole('button', { name: 'blockList.timeBlock' });

const open = () => fireEvent.click(button());

describe('timingDateRange', () => {
  it('leaves an empty range empty', () => {
    expect(timingDateRange({ from: null, to: null })).toEqual({
      from: null,
      to: null,
    });
  });

  it('runs from the start of the first day to the end of the last', () => {
    expect(
      timingDateRange({
        from: new Date('2026-01-05T11:30:00'),
        to: new Date('2026-01-07T11:30:00'),
      })
    ).toEqual({
      from: new Date('2026-01-05T00:00:00.000').toISOString(),
      to: new Date('2026-01-07T23:59:59.999').toISOString(),
    });
  });
});

describe('dateRangeOf', () => {
  it('reads a window without dates as an empty range', () => {
    expect(dateRangeOf({})).toEqual({ from: null, to: null });
  });

  it('shows the last day of the range as the day it ends on', () => {
    const range = dateRangeOf({
      from: new Date('2026-01-05T00:00:00').toISOString(),
      to: new Date('2026-01-07T23:59:59.999').toISOString(),
    });

    expect(range.to?.getDate()).toBe(7);
  });
});

const interpolate = (key: string, options?: Record<string, unknown>) =>
  options ?
    `${key}{${Object.entries(options)
      .map(([name, value]) => `${name}=${value}`)
      .join(';')}}`
  : key;

describe('describeTiming', () => {
  const describe_ = (timing: BlockTimingInput | null) =>
    describeTiming(timing, interpolate, 'en');

  it('says an unscheduled block always shows', () => {
    expect(describe_(null)).toBe('blockTiming.summary.always');
    expect(describe_({ weekdays: [], timeOfDay: null })).toBe(
      'blockTiming.summary.always'
    );
  });

  it('names the days the block shows on', () => {
    expect(describe_({ weekdays: [Weekday.Monday, Weekday.Friday] })).toBe(
      'blockTiming.summary.shows{conditions=blockTiming.summary.days{days=weekdayRecurring.Monday and weekdayRecurring.Friday}}'
    );
  });

  it('separates all but the last day with commas', () => {
    expect(
      describe_({
        weekdays: [Weekday.Monday, Weekday.Wednesday, Weekday.Friday],
      })
    ).toBe(
      'blockTiming.summary.shows{conditions=blockTiming.summary.days{days=weekdayRecurring.Monday, weekdayRecurring.Wednesday, and weekdayRecurring.Friday}}'
    );
  });

  it('names the hours the block shows during', () => {
    expect(describe_({ timeOfDay: { from: '08:00', to: '17:00' } })).toBe(
      'blockTiming.summary.shows{conditions=blockTiming.summary.hours{from=08:00;to=17:00}}'
    );
  });

  it('names the last day of the range as the day it ends on', () => {
    expect(
      describe_({
        from: new Date('2026-11-01T00:00:00').toISOString(),
        to: new Date('2026-11-30T23:59:59.999').toISOString(),
      })
    ).toBe(
      'blockTiming.summary.shows{conditions=blockTiming.summary.between{from=Nov 1, 2026;to=Nov 30, 2026}}'
    );
  });

  it('admits that equal start and end times never show the block', () => {
    expect(
      describe_({
        weekdays: [Weekday.Monday],
        timeOfDay: { from: '08:00', to: '08:00' },
      })
    ).toBe('blockTiming.summary.never');
  });

  it('describes a range open on one end', () => {
    expect(
      describe_({ from: new Date('2026-11-01T00:00:00').toISOString() })
    ).toBe(
      'blockTiming.summary.shows{conditions=blockTiming.summary.since{from=Nov 1, 2026}}'
    );
    expect(
      describe_({ to: new Date('2026-11-30T23:59:59.999').toISOString() })
    ).toBe(
      'blockTiming.summary.shows{conditions=blockTiming.summary.until{to=Nov 30, 2026}}'
    );
  });

  it('lists the conditions without stacking up "and"s', () => {
    expect(
      describe_({
        weekdays: [Weekday.Saturday],
        timeOfDay: { from: '08:00', to: '17:00' },
      })
    ).toBe(
      'blockTiming.summary.shows{conditions=blockTiming.summary.days{days=weekdayRecurring.Saturday}, blockTiming.summary.hours{from=08:00;to=17:00}}'
    );
  });
});

describe('BlockTimingButton', () => {
  it('tells an untimed block from a timed one', () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <BlockTimingButton
          timing={null}
          onChange={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(button()).toHaveAttribute('data-timed', 'false');

    rerender(
      <ThemeProvider theme={theme}>
        <BlockTimingButton
          timing={{ weekdays: [Weekday.Monday] }}
          onChange={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(button()).toHaveAttribute('data-timed', 'true');
  });

  it('reads a window without any setting as untimed', () => {
    renderButton({ from: null, to: null, weekdays: [], timeOfDay: null });

    expect(button()).toHaveAttribute('data-timed', 'false');
  });

  it('says when a timed block is off air right now', () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <BlockTimingButton
          timing={{ weekdays: [Weekday.Monday] }}
          shouldDisplay={false}
          onChange={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(button()).toHaveAttribute('data-showing', 'false');

    rerender(
      <ThemeProvider theme={theme}>
        <BlockTimingButton
          timing={{ weekdays: [Weekday.Monday] }}
          shouldDisplay
          onChange={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(button()).toHaveAttribute('data-showing', 'true');
  });

  it('spends less width on margins on phones, so every day stays big enough to tap', () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
        }) as unknown as MediaQueryList
    );

    try {
      renderButton(null);
      open();

      const dialog = screen.getByRole('dialog');

      expect(dialog).not.toHaveClass('MuiDialog-paperFullScreen');
      expect(getComputedStyle(dialog).marginLeft).toBe('16px');
      expect(getComputedStyle(dialog).width).toBe('calc(100% - 32px)');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('opens the window of a block on demand', () => {
    renderButton(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    open();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('can be a labelled button that opens the same window', () => {
    render(
      <ThemeProvider theme={theme}>
        <BlockTimingButton
          timing={{ weekdays: [Weekday.Monday] }}
          label="Edit schedule"
          onChange={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.queryByRole('button', { name: 'blockList.timeBlock' })
    ).not.toBeInTheDocument();

    const labelled = screen.getByRole('button', { name: 'Edit schedule' });

    expect(labelled).toHaveAttribute('data-timed', 'true');

    fireEvent.click(labelled);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  const weekday = (name: string) =>
    screen.getByRole('button', { name: `weekday.${name}` });

  it('groups the weekdays under one name', () => {
    renderButton(null);

    open();

    expect(
      screen.getByRole('group', { name: 'blockTiming.weekdays' })
    ).toBeInTheDocument();
  });

  it('marks the weekdays the block shows on', () => {
    renderButton({ weekdays: [Weekday.Monday, Weekday.Friday] });

    open();

    expect(weekday('Monday')).toHaveAttribute('aria-pressed', 'true');
    expect(weekday('Friday')).toHaveAttribute('aria-pressed', 'true');
    expect(weekday('Tuesday')).toHaveAttribute('aria-pressed', 'false');
  });

  it('picks several weekdays the block shows on', () => {
    const onChange = renderButton({ weekdays: [Weekday.Friday] });

    open();
    fireEvent.click(weekday('Monday'));

    expect(onChange).toHaveBeenCalledWith({
      weekdays: [Weekday.Monday, Weekday.Friday],
    });
  });

  it('drops a weekday that is picked again', () => {
    const onChange = renderButton({ weekdays: [Weekday.Monday] });

    open();
    fireEvent.click(weekday('Monday'));

    expect(onChange).toHaveBeenCalledWith({ weekdays: [] });
  });

  it('spells out the schedule while it is edited', () => {
    renderButton(null);

    open();

    expect(screen.getByText('blockTiming.summary.always')).toBeInTheDocument();
  });

  it('warns that equal start and end times never show the block', () => {
    renderButton({ timeOfDay: { from: '08:00', to: '08:00' } });

    open();

    expect(screen.getByText('blockTiming.sameTimes')).toBeInTheDocument();
  });

  it('stops claiming the block is hidden once its schedule changes', () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <BlockTimingButton
          timing={{ weekdays: [Weekday.Monday] }}
          shouldDisplay={false}
          onChange={vi.fn()}
        />
      </ThemeProvider>
    );

    open();

    expect(screen.getByText('blockTiming.offAir')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <BlockTimingButton
          timing={{ weekdays: [Weekday.Monday, Weekday.Tuesday] }}
          shouldDisplay={false}
          onChange={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.queryByText('blockTiming.offAir')).not.toBeInTheDocument();
  });

  it('fills in the other end of the daily window', () => {
    const onChange = renderButton(null);

    open();
    fireEvent.change(
      screen.getByRole('textbox', { name: 'blockTiming.timeOfDayFrom' }),
      { target: { value: '0800' } }
    );

    expect(onChange).toHaveBeenCalledWith({
      timeOfDay: { from: '08:00', to: '00:00' },
    });
  });

  it('names the pair of daily times as one group', () => {
    renderButton(null);

    open();

    expect(
      screen.getByRole('group', { name: 'blockTiming.timeOfDay' })
    ).toBeInTheDocument();
  });

  it('lets the block show all day again', () => {
    const onChange = renderButton({
      timeOfDay: { from: '08:00', to: '17:00' },
    });

    open();
    fireEvent.click(screen.getByText('blockTiming.clearTimeOfDay'));

    expect(onChange).toHaveBeenCalledWith({ timeOfDay: null });
  });

  it('clears the whole window', () => {
    const onChange = renderButton({ weekdays: [Weekday.Monday] });

    open();
    fireEvent.click(screen.getByText('blockTiming.clear'));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
