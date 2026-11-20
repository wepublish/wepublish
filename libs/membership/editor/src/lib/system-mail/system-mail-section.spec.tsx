import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  MailTemplateDocument,
  SystemMailsDocument,
  UserEvent,
} from '@wepublish/editor/api';

import { SystemMailSection } from './system-mail-section';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <SystemMailSection />
    </ThemeProvider>
  );

const mockedUseQuery = useQuery as unknown as Mock;

const template = (id: string, name: string, channels: string[]) => ({
  id,
  name,
  description: null,
  subject: name,
  context: null,
  status: 'ok',
  channels,
});

const systemMails = [
  UserEvent.PasswordReset,
  UserEvent.AccountCreation,
  UserEvent.EmailChange,
  UserEvent.LoginLink,
].map(event => ({ __typename: 'SystemMailModel', event, mailTemplate: null }));

beforeEach(() => {
  const results = new Map<unknown, unknown>([
    [SystemMailsDocument, { systemMails }],
    [MailTemplateDocument, { mailTemplates: [] }],
  ]);

  mockedUseQuery.mockReset();
  mockedUseQuery.mockImplementation((document: unknown) => ({
    data: results.get(document),
  }));
});

describe('SystemMailSection', () => {
  it('heads the account mails like the flows above them', () => {
    renderPage();

    const section = screen.getByRole('region', { name: 'systemMails.title' });

    expect(
      within(section).getByRole('heading', {
        level: 2,
        name: 'systemMails.title',
      })
    ).toBeTruthy();
  });

  it('lists the account mails as a table with a row per event', () => {
    renderPage();

    const table = screen.getByRole('table');

    expect(
      within(table)
        .getAllByRole('columnheader')
        .map(header => header.textContent)
    ).toEqual([
      'systemMails.columns.event',
      'systemMails.columns.userAction',
      'systemMails.columns.template',
      'action',
    ]);

    const rows = within(table).getAllByRole('row').slice(1);

    expect(
      rows.map(row =>
        within(row)
          .getAllByRole('cell')
          .slice(0, 2)
          .map(cell => cell.textContent)
      )
    ).toEqual([
      [
        'systemMails.events.account_creation',
        'systemMails.eventInfo.account_creation.userAction',
      ],
      [
        'systemMails.events.login_link',
        'systemMails.eventInfo.login_link.userAction',
      ],
      [
        'systemMails.events.email_change',
        'systemMails.eventInfo.email_change.userAction',
      ],
      [
        'systemMails.events.password_reset',
        'systemMails.eventInfo.password_reset.userAction',
      ],
    ]);

    for (const row of rows) {
      expect(within(row).getByRole('combobox')).toBeTruthy();
      expect(
        within(row).getByRole('button', { name: /systemMails.sendTest/ })
      ).toBeTruthy();
    }
  });

  it('keeps the whole user action at hand when its column is too narrow for it', () => {
    renderPage();

    const action = screen.getByText(
      'systemMails.eventInfo.login_link.userAction'
    );

    expect(action.getAttribute('title')).toBe(
      'systemMails.eventInfo.login_link.userAction'
    );
  });

  it('explains an event next to its name', () => {
    renderPage();

    const row = screen
      .getByText('systemMails.events.login_link')
      .closest('tr') as HTMLElement;

    expect(
      within(row).getByRole('button', {
        name: 'systemMails.eventInfo.login_link.description',
      })
    ).toBeTruthy();
  });

  it('offers only templates with an email version: a system mail is never a letter', () => {
    mockedUseQuery.mockImplementation((document: unknown) => ({
      data:
        document === SystemMailsDocument ? { systemMails }
        : document === MailTemplateDocument ?
          {
            mailTemplates: [
              template('tpl-1', 'Willkommen', ['mail']),
              template('tpl-2', 'Begleitbrief', ['letter']),
              template('tpl-3', 'Rechnung', ['mail', 'letter']),
            ],
          }
        : undefined,
    }));
    renderPage();

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);

    const options = within(screen.getByRole('listbox'))
      .getAllByRole('option')
      .map(option => option.textContent);

    expect(options.some(label => label?.includes('Willkommen'))).toBe(true);
    expect(options.some(label => label?.includes('Rechnung'))).toBe(true);
    expect(options.some(label => label?.includes('Begleitbrief'))).toBe(false);
  });
});
