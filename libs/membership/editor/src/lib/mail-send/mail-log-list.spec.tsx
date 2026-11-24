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
import { MailLogsDocument, MailLogState } from '@wepublish/editor/api';
import {
  AuthContext,
  enqueueSnackbar,
  sessionWithPermissions,
} from '@wepublish/ui/editor';
import { CanGetMailLogs, CanGetSubscription } from '@wepublish/permissions';
import { MemoryRouter } from 'react-router-dom';

import { MailLogList } from './mail-log-list';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  useApolloClient: () => ({ query: vi.fn() }),
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

const sessionWith = (...permissions: string[]) => ({
  session: {
    ...sessionWithPermissions.session,
    sessionRoles: [
      {
        ...sessionWithPermissions.session.sessionRoles[0],
        permissions: permissions.map(id => ({
          id,
          description: id,
          deprecated: false,
        })),
      },
    ],
  },
});

const renderPage = (url = '/maillog', auth = sessionWithPermissions) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={auth}>
          <MailLogList />
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

const STORAGE_KEY = 'wepublish:editor:listState:mail-log';

const lastMailLogsVariables = () =>
  (useQuery as unknown as Mock).mock.calls
    .filter(([document]) => document === MailLogsDocument)
    .at(-1)?.[1]?.variables;

const openFilters = () =>
  fireEvent.click(
    screen.getByRole('button', { name: /filterableList.filter.label/ })
  );

beforeEach(() => {
  localStorage.clear();
  (useQuery as unknown as Mock).mockClear();
  (useQuery as unknown as Mock).mockReturnValue({
    data: undefined,
    loading: false,
  });
});

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

  it('keeps the filters folded away behind the filter button, like the other lists', () => {
    renderPage();

    expect(
      screen.queryByRole('combobox', { name: /^mailLog\.filter\.template/ })
    ).toBeNull();

    openFilters();

    expect(
      screen.getByRole('combobox', { name: /^mailLog\.filter\.template/ })
    ).toBeTruthy();
  });

  it('changes the page size', () => {
    renderPage();

    fireEvent.change(
      screen.getByRole('combobox', { name: 'listView.pagination.pageSize' }),
      { target: { value: '20' } }
    );

    expect(lastMailLogsVariables()).toMatchObject({ take: 20, skip: 0 });
  });

  it('remembers filters and page size for the next visit', () => {
    const { unmount } = renderPage();

    openFilters();
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: /^mailLog\.filter\.state/ })
    );
    fireEvent.click(screen.getByRole('option', { name: MailLogState.Bounced }));
    fireEvent.change(
      screen.getByRole('combobox', { name: 'listView.pagination.pageSize' }),
      { target: { value: '100' } }
    );
    unmount();

    renderPage();

    expect(lastMailLogsVariables()).toMatchObject({
      filter: { state: MailLogState.Bounced },
      take: 100,
    });
  });

  it('shows exactly the linked send, whatever filters were remembered', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        filter: { channel: 'letter' },
        sortField: 'sentDate',
        sortOrder: 'desc',
        limit: 20,
      })
    );

    renderPage(`/maillog?job=job-1&state=${MailLogState.Rejected}`);

    const variables = lastMailLogsVariables();
    expect(variables.filter).toEqual({
      mailSendJobId: 'job-1',
      state: MailLogState.Rejected,
    });
    expect(variables.take).toBe(20);
  });

  it('names every filter by its caption', () => {
    renderPage();
    openFilters();

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
        .getAllByRole('status')
        .some(status => status.textContent?.includes('mailLog.empty'))
    ).toBe(true);
  });

  describe('why a mail bounced', () => {
    const log = (overrides: object) => ({
      id: 'log-1',
      sentDate: '2026-11-01T10:00:00.000Z',
      state: 'bounced',
      type: 'subscriptionFlow',
      channel: 'mail',
      subject: 'Invoice',
      recipient: { id: 'u1', email: 'jane@example.com' },
      mailTemplate: { id: 'tpl-1', name: 'Invoice' },
      error: null,
      ...overrides,
    });

    const showsLogs = (...nodes: object[]) =>
      (useQuery as unknown as Mock).mockReturnValue({
        data: {
          mailTemplates: [],
          mailSendJobs: { nodes: [] },
          mailLogs: { nodes, totalCount: nodes.length },
        },
        loading: false,
      });

    const explanationOf = (text: string) => {
      fireEvent.click(screen.getByText(text));

      return screen.getByRole('presentation').textContent;
    };

    beforeEach(() => {
      localStorage.clear();
    });

    it("shows the provider's reason in the error column, without switching anything on", () => {
      showsLogs(log({ error: 'bad_mailbox: 554 5.7.1 User unknown' }));
      renderPage();

      const headers = screen
        .getAllByRole('columnheader')
        .map(header => header.textContent);

      expect(headers).toContain('mailLog.error');
      expect(headers).not.toContain('mailLog.bounceReason');
      expect(
        screen.getByRole('cell', {
          name: 'bad_mailbox: 554 5.7.1 User unknown',
        })
      ).toBeTruthy();
    });

    it('explains a mailbox that does not exist', () => {
      showsLogs(log({ error: 'bad_mailbox: 554 5.7.1 User unknown' }));
      renderPage();

      expect(explanationOf('bad_mailbox: 554 5.7.1 User unknown')).toContain(
        'mailLog.errorHelp.mailboxGone.cause'
      );
    });

    it('explains a bounce by what the receiving server said, not by the sending setup', () => {
      showsLogs(
        log({ state: 'deferred', error: 'general: 451 4.7.1 Try again later' })
      );
      renderPage();

      expect(explanationOf('general: 451 4.7.1 Try again later')).toContain(
        'mailLog.errorHelp.bounce.cause'
      );
    });
  });

  describe('what a mail is about', () => {
    const log = (overrides: object) => ({
      id: 'log-1',
      sentDate: '2026-11-01T10:00:00.000Z',
      state: 'delivered',
      type: 'subscriptionFlow',
      channel: 'mail',
      subject: 'Reminder',
      recipient: { id: 'u1', email: 'jane@example.com' },
      mailTemplate: { id: 'tpl-1', name: 'Reminder' },
      subscriptionId: null,
      invoiceId: null,
      ...overrides,
    });

    const headers = () =>
      screen.getAllByRole('columnheader').map(header => header.textContent);

    const showTrigger = () => {
      fireEvent.click(
        screen.getByRole('button', { name: /columnConfigurator.title/ })
      );
      fireEvent.click(
        screen.getByRole('menuitemcheckbox', { name: 'mailLog.trigger' })
      );
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    };

    beforeEach(() => {
      localStorage.clear();
      (useQuery as unknown as Mock).mockReturnValue({
        data: {
          mailTemplates: [],
          mailSendJobs: { nodes: [] },
          mailLogs: {
            nodes: [
              log({ id: 'log-1', subscriptionId: 'sub-1', invoiceId: 'inv-1' }),
              log({ id: 'log-2' }),
            ],
            totalCount: 2,
          },
        },
        loading: false,
      });
    });

    it('keeps the column out of sight until it is switched on', () => {
      renderPage();

      expect(headers()).not.toContain('mailLog.trigger');

      showTrigger();

      expect(headers()).toContain('mailLog.trigger');
    });

    it('links a mail to the subscription and names the invoice it is about', () => {
      renderPage();
      showTrigger();

      const [, about, noTrigger] = screen.getAllByRole('row');

      expect(
        within(about)
          .getByRole('link', { name: 'mailLog.triggerSubscription' })
          .getAttribute('href')
      ).toBe('/subscriptions/edit/sub-1');
      expect(within(about).getByText('mailLog.triggerInvoice')).toBeTruthy();
      expect(
        within(noTrigger).queryByRole('link', {
          name: 'mailLog.triggerSubscription',
        })
      ).toBeNull();
    });

    it('only names the subscription for someone who may not open subscriptions', () => {
      renderPage('/maillog', sessionWith(CanGetMailLogs.id));
      showTrigger();

      const [, about] = screen.getAllByRole('row');

      expect(
        within(about).getByText('mailLog.triggerSubscription')
      ).toBeTruthy();
      expect(within(about).queryByRole('link')).toBeNull();
    });

    it('links the recipient to their user page', () => {
      renderPage();

      const [, first] = screen.getAllByRole('row');

      expect(
        within(first)
          .getByRole('link', { name: 'jane@example.com' })
          .getAttribute('href')
      ).toBe('/users/edit/u1');
    });

    it('only names the recipient for someone who may not open users', () => {
      renderPage(
        '/maillog',
        sessionWith(CanGetMailLogs.id, CanGetSubscription.id)
      );

      const [, first] = screen.getAllByRole('row');

      expect(within(first).getByText('jane@example.com')).toBeTruthy();
      expect(
        within(first).queryByRole('link', { name: 'jane@example.com' })
      ).toBeNull();
    });
  });
});
