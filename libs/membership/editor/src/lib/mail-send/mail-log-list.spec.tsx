import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { AuthContext, sessionWithPermissions } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { MailLogList } from './mail-log-list';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
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
    ).toBe('9');
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
