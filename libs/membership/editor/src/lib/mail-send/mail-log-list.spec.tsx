import type { Mock } from 'vitest';
import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  AuthContext,
  enqueueSnackbar,
  sessionWithPermissions,
} from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { MailLogList } from './mail-log-list';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  enqueueSnackbar: vi.fn(),
}));

const paperLetters = vi.fn(() => false);

vi.mock('../mail-template/use-letter-channel', () => ({
  useLetterChannel: () => ({
    paperLetters: paperLetters(),
    letterAvailable: paperLetters(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MailLogList />
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

describe('MailLogList', () => {
  beforeEach(() => {
    paperLetters.mockReturnValue(false);
    (enqueueSnackbar as unknown as Mock).mockClear();
  });

  describe('refreshing the delivery states', () => {
    const syncAnswers = (answer: Record<string, number>) => {
      const sync = vi.fn(async () => ({
        data: { syncMailLogStates: answer },
      }));
      (useMutation as unknown as Mock).mockReturnValue([
        sync,
        { loading: false },
      ]);

      return sync;
    };

    const pressSync = () =>
      fireEvent.click(
        screen.getByRole('button', { name: /mailLog\.sync\.action/ })
      );

    afterEach(() => {
      (useMutation as unknown as Mock).mockReturnValue([
        vi.fn(),
        { loading: false },
      ]);
    });

    it('reports the mails alone when no letter was asked about', async () => {
      const sync = syncAnswers({
        checked: 4,
        updated: 0,
        lettersChecked: 0,
        lettersUpdated: 0,
      });
      renderPage();

      pressSync();

      await waitFor(() => expect(enqueueSnackbar).toHaveBeenCalled());
      expect(sync).toHaveBeenCalledTimes(1);
      expect(enqueueSnackbar).toHaveBeenCalledWith('mailLog.sync.done', {
        variant: 'info',
      });
    });

    it('reports the letters too once some were asked about', async () => {
      syncAnswers({
        checked: 4,
        updated: 0,
        lettersChecked: 12,
        lettersUpdated: 3,
      });
      renderPage();

      pressSync();

      await waitFor(() => expect(enqueueSnackbar).toHaveBeenCalled());
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        'mailLog.sync.doneWithLetters',
        { variant: 'success' }
      );
    });

    it('explains the button for mails only where no letters are printed', () => {
      renderPage();

      expect(screen.getByLabelText('mailLog.sync.hint')).toBeTruthy();
      expect(
        screen.queryByLabelText('mailLog.sync.hintWithLetters')
      ).toBeNull();
    });

    it('explains that letters are asked about too where they are printed', () => {
      paperLetters.mockReturnValue(true);
      renderPage();

      expect(
        screen.getByLabelText('mailLog.sync.hintWithLetters')
      ).toBeTruthy();
    });
  });

  describe('the state legend', () => {
    const openLegend = () =>
      fireEvent.click(
        screen.getByRole('button', { name: 'mailLog.stateHelp.legendTitle' })
      );

    it('says how letter states are kept current where letters are printed', () => {
      paperLetters.mockReturnValue(true);
      renderPage();

      openLegend();

      expect(
        screen.getByText(/mailLog\.stateHelp\.legendFooterLetters/)
      ).toBeTruthy();
    });

    it('leaves letters out where none are printed', () => {
      renderPage();

      openLegend();

      expect(screen.getByText(/mailLog\.stateHelp\.legendFooter/)).toBeTruthy();
      expect(
        screen.queryByText(/mailLog\.stateHelp\.legendFooterLetters/)
      ).toBeNull();
    });
  });

  it('ties the tabs to the panel they show', () => {
    renderPage();

    const tablist = screen.getByRole('tablist', { name: 'mailLog.title' });
    const mails = within(tablist).getByRole('tab', {
      name: 'mailLog.tabs.mails',
    });
    const panel = screen.getByRole('tabpanel', { name: 'mailLog.tabs.mails' });

    expect(mails).toHaveAttribute('aria-controls', panel.id);
  });

  it('names every filter by its caption', () => {
    renderPage();

    for (const name of [
      /^mailLog\.filter\.job\b/,
      /^mailLog\.filter\.template/,
      /^mailLog\.filter\.state/,
      /^mailLog\.filter\.type/,
    ]) {
      expect(screen.getByRole('combobox', { name })).toBeTruthy();
    }
  });

  it('says so in the table when no mail was sent', () => {
    (useQuery as unknown as Mock).mockReturnValue({
      data: {
        mailTemplates: [],
        mailSendJobs: { nodes: [] },
        mailLogs: { nodes: [], totalCount: 0 },
      },
      loading: false,
    });

    renderPage();

    expect(
      screen
        .getByRole('cell', { name: 'mailLog.empty' })
        .getAttribute('colspan')
    ).toBe('7');
  });
});
