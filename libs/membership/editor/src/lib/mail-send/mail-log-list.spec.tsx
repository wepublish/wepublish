import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MailLogsDocument, MailLogState } from '@wepublish/editor/api';
import { AuthContext, sessionWithPermissions } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { MailLogList } from './mail-log-list';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  useApolloClient: () => ({ query: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderPage = (url = '/maillog') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={sessionWithPermissions}>
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

  it('links a mail to the subscription and names the invoice it is about', () => {
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

    renderPage();

    const [, about, noTrigger] = screen.getAllByRole('row');

    expect(
      within(about)
        .getByRole('link', { name: 'mailLog.triggerSubscription' })
        .getAttribute('href')
    ).toBe('/subscriptions/edit/sub-1');
    expect(within(about).getByText('mailLog.triggerInvoice')).toBeTruthy();
    expect(within(noTrigger).queryByRole('link')).toBeNull();
  });
});
