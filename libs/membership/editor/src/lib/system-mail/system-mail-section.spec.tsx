import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <SystemMailSection />
    </ThemeProvider>
  );

const mockedUseQuery = useQuery as unknown as Mock;

const systemMails = [
  UserEvent.PasswordReset,
  UserEvent.AccountCreation,
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
  it('shows the account mails as one block with a row per event', () => {
    const { container } = renderPage();

    const block = screen.getByRole('region', { name: 'systemMails.title' });
    const rows = within(block).getAllByRole('listitem');

    expect(
      rows.map(row => within(row).getByRole('heading').textContent)
    ).toEqual([
      'systemMails.events.account_creation',
      'systemMails.events.login_link',
      'systemMails.events.password_reset',
    ]);
    expect(
      within(rows[0]).getByRole('button', { name: /systemMails.sendTest/ })
    ).toBeTruthy();
    expect(container.querySelector('table')).toBeNull();
  });
});
