import { createTheme, ThemeProvider } from '@mui/material';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MailHistoryMatch } from '@wepublish/editor/api';

import { emptyMailHistoryRow } from './audience-state';
import { MailHistoryFilter } from './mail-history-filter';

const queries = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    queries(operationName(document), options),
}));

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
      {label}
    </button>
  ),
}));

const letterChannel = vi.fn(() => ({
  paperLetters: true,
  letterAvailable: true,
}));

vi.mock('../../mail-template/use-letter-channel', () => ({
  useLetterChannel: () => letterChannel(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const row = (overrides = {}) => ({
  ...emptyMailHistoryRow(),
  id: 'row-a',
  mailTemplateId: 'tpl-1',
  ...overrides,
});

const renderFilter = (
  value = { match: MailHistoryMatch.All, rows: [] as ReturnType<typeof row>[] }
) => {
  const onChange = vi.fn();

  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MailHistoryFilter
        value={value}
        onChange={onChange}
      />
    </ThemeProvider>
  );

  return onChange;
};

describe('MailHistoryFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    letterChannel.mockReturnValue({
      paperLetters: true,
      letterAvailable: true,
    });
    queries.mockReturnValue({
      data: {
        mailTemplates: [
          { id: 'tpl-1', name: 'Rechnung' },
          { id: 'tpl-2', name: 'Erinnerung' },
        ],
      },
    });
  });

  afterEach(cleanup);

  it('starts empty and adds a blank row', () => {
    const onChange = renderFilter();

    expect(screen.queryByRole('combobox')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'mailSend.mailHistory.add' })
    );

    expect(onChange).toHaveBeenCalledWith({
      match: MailHistoryMatch.All,
      rows: [expect.objectContaining({ mailTemplateId: null, negate: false })],
    });
  });

  it('lets a row say which template was, or was not, sent', () => {
    const onChange = renderFilter({
      match: MailHistoryMatch.All,
      rows: [row()],
    });

    const [direction] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(direction);
    fireEvent.click(
      screen.getByRole('option', { name: 'mailSend.mailHistory.notReceived' })
    );

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        rows: [
          expect.objectContaining({ mailTemplateId: 'tpl-1', negate: true }),
        ],
      })
    );
  });

  it('takes a send period from the range picker', () => {
    const onChange = renderFilter({
      match: MailHistoryMatch.All,
      rows: [row()],
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'mailSend.mailHistory.sentBetween' })
    );

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        rows: [
          expect.objectContaining({
            from: new Date('2026-01-01T10:00:00.000Z'),
            to: new Date('2026-01-31T10:00:00.000Z'),
          }),
        ],
      })
    );
  });

  it('removes a row', () => {
    const onChange = renderFilter({
      match: MailHistoryMatch.All,
      rows: [row(), row({ id: 'row-b', mailTemplateId: 'tpl-2' })],
    });

    fireEvent.click(
      screen.getAllByRole('button', { name: 'mailSend.mailHistory.remove' })[0]
    );

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        rows: [expect.objectContaining({ id: 'row-b' })],
      })
    );
  });

  it('offers all-or-any only once there is something to combine', () => {
    cleanup();
    renderFilter({ match: MailHistoryMatch.All, rows: [row()] });
    expect(screen.queryByText('mailSend.mailHistory.match.any')).toBeNull();

    cleanup();
    const onChange = renderFilter({
      match: MailHistoryMatch.All,
      rows: [row(), row({ id: 'row-b' })],
    });

    fireEvent.click(
      screen.getByRole('radio', { name: 'mailSend.mailHistory.match.any' })
    );

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ match: MailHistoryMatch.Any })
    );
  });

  it('keeps the channel label out of the way of «Beliebig» before any click', () => {
    renderFilter({ match: MailHistoryMatch.All, rows: [row()] });

    // The input label (a div in this MUI) and the fieldset legend both carry
    // the text; only the label has the shrink state.
    const label = screen
      .getAllByText('mailSend.mailHistory.channel')
      .find(element => element.classList.contains('MuiInputLabel-root'));
    expect(label?.className).toMatch(/MuiInputLabel-shrink/);
  });

  it('hides the channel choice while letters are not available', () => {
    renderFilter({ match: MailHistoryMatch.All, rows: [row()] });
    // MUI renders a field label twice (label and fieldset legend).
    expect(
      screen.getAllByText('mailSend.mailHistory.channel').length
    ).toBeGreaterThan(0);

    cleanup();
    letterChannel.mockReturnValue({
      paperLetters: false,
      letterAvailable: false,
    });
    renderFilter({ match: MailHistoryMatch.All, rows: [row()] });

    expect(screen.queryAllByText('mailSend.mailHistory.channel')).toHaveLength(
      0
    );
  });
});
