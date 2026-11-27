import { createTheme, ThemeProvider } from '@mui/material';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MailRollingKind } from '@wepublish/editor/api';

import { DateWindowFilter, DateWindowFilterProps } from './date-window-filter';

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  DateRangeFilter: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (range: { from: Date | null; to: Date | null }) => void;
  }) => (
    <button
      onClick={() =>
        onChange({
          from: new Date('2026-01-01T10:00:00.000Z'),
          to: new Date('2026-01-31T10:00:00.000Z'),
        })
      }
    >
      picker:{label}
    </button>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const ALL_KINDS = [
  MailRollingKind.LastDays,
  MailRollingKind.OlderThanDays,
  MailRollingKind.NextDays,
];

const renderFilter = (props: Partial<DateWindowFilterProps> = {}) => {
  const onRangeChange = vi.fn();
  const onRollingChange = vi.fn();

  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <DateWindowFilter
        label="Sent"
        range={{ from: null, to: null }}
        rolling={null}
        kinds={ALL_KINDS}
        onRangeChange={onRangeChange}
        onRollingChange={onRollingChange}
        {...props}
      />
    </ThemeProvider>
  );

  return { onRangeChange, onRollingChange };
};

const button = (name: string) => screen.getByRole('button', { name });

describe('DateWindowFilter', () => {
  afterEach(cleanup);

  it('shows the date picker for fixed dates and marks that mode as chosen', () => {
    const { onRangeChange } = renderFilter();

    expect(
      button('mailSend.dateWindow.fixed').getAttribute('aria-pressed')
    ).toBe('true');
    expect(
      button('mailSend.dateWindow.rolling').getAttribute('aria-pressed')
    ).toBe('false');

    fireEvent.click(button('picker:Sent'));

    expect(onRangeChange).toHaveBeenCalledWith({
      from: new Date('2026-01-01T10:00:00.000Z'),
      to: new Date('2026-01-31T10:00:00.000Z'),
    });
  });

  it('switches to a rolling range of the first kind on offer', () => {
    const { onRollingChange } = renderFilter({
      kinds: [MailRollingKind.OlderThanDays, MailRollingKind.LastDays],
    });

    fireEvent.click(button('mailSend.dateWindow.rolling'));

    expect(onRollingChange).toHaveBeenCalledWith({
      kind: MailRollingKind.OlderThanDays,
      days: 30,
    });
  });

  it('switches back to fixed dates', () => {
    const { onRollingChange } = renderFilter({
      rolling: { kind: MailRollingKind.LastDays, days: 7 },
    });

    fireEvent.click(button('mailSend.dateWindow.fixed'));

    expect(onRollingChange).toHaveBeenCalledWith(null);
  });

  it('replaces the picker by the day count while rolling', () => {
    renderFilter({ rolling: { kind: MailRollingKind.LastDays, days: 7 } });

    expect(screen.queryByRole('button', { name: 'picker:Sent' })).toBeNull();
    expect(
      (
        screen.getByRole('spinbutton', {
          name: 'mailSend.dateWindow.days',
        }) as HTMLInputElement
      ).value
    ).toBe('7');
  });

  it('takes a new day count and ignores what is not a positive number', () => {
    const { onRollingChange } = renderFilter({
      rolling: { kind: MailRollingKind.LastDays, days: 7 },
    });
    const days = screen.getByRole('spinbutton', {
      name: 'mailSend.dateWindow.days',
    });

    fireEvent.change(days, { target: { value: '14' } });
    fireEvent.change(days, { target: { value: '' } });
    fireEvent.change(days, { target: { value: '0' } });

    expect(onRollingChange.mock.calls).toEqual([
      [{ kind: MailRollingKind.LastDays, days: 14 }],
    ]);
  });

  it('offers quick picks for common day counts', () => {
    const { onRollingChange } = renderFilter({
      rolling: { kind: MailRollingKind.OlderThanDays, days: 14 },
    });

    fireEvent.click(button('mailSend.dateWindow.quick:{"days":30}'));

    expect(onRollingChange).toHaveBeenCalledWith({
      kind: MailRollingKind.OlderThanDays,
      days: 30,
    });
  });

  it('lets the kind be chosen among those on offer', () => {
    const { onRollingChange } = renderFilter({
      rolling: { kind: MailRollingKind.LastDays, days: 7 },
      kinds: [MailRollingKind.LastDays, MailRollingKind.OlderThanDays],
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Sent' }));

    expect(
      screen.queryByRole('option', {
        name: 'mailSend.dateWindow.kinds.nextDays',
      })
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('option', {
        name: 'mailSend.dateWindow.kinds.olderThanDays',
      })
    );

    expect(onRollingChange).toHaveBeenCalledWith({
      kind: MailRollingKind.OlderThanDays,
      days: 7,
    });
  });

  it('names the only kind instead of offering a choice of one', () => {
    renderFilter({
      rolling: { kind: MailRollingKind.LastDays, days: 90 },
      kinds: [MailRollingKind.LastDays],
    });

    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByText('mailSend.dateWindow.kinds.lastDays')).toBeTruthy();
  });
});
