import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  MailSendRecipientPreviewDocument,
  MailTemplateDocument,
} from '@wepublish/editor/api';
import { AuthContext, sessionWithPermissions } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { MailSendPage } from './mail-send-page';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const results = new Map<unknown, unknown>([
  [
    MailSendRecipientPreviewDocument,
    { mailSendRecipientPreview: { count: 11, userCount: 11, recipients: [] } },
  ],
  [MailTemplateDocument, { mailTemplates: [] }],
]);

const renderPage = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MailSendPage />
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

describe('MailSendPage', () => {
  beforeEach(() => {
    (useQuery as unknown as Mock).mockImplementation((document: unknown) => ({
      data: results.get(document),
      loading: false,
      refetch: vi.fn(),
    }));
  });

  it('names the audience choice', () => {
    renderPage();

    expect(
      screen.getByRole('radiogroup', { name: 'mailSend.base.label' })
    ).toBeTruthy();
  });

  it('announces the recipient count politely', () => {
    renderPage();

    expect(
      screen
        .getAllByRole('status')
        .some(status => status.textContent === 'mailSend.recipientsCount')
    ).toBe(true);
  });

  it('keeps the static preview hint out of the alert role', () => {
    renderPage();

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('moves focus to the next step and labels its template select', () => {
    renderPage();

    const next = screen.getByRole('button', { name: 'mailSend.next' });
    next.focus();
    fireEvent.click(next);

    expect(
      screen.getByRole('heading', { level: 2, name: 'mailSend.template' })
    ).toHaveFocus();
    expect(
      screen.getByRole('combobox', { name: /^mailSend\.template/ })
    ).toBeTruthy();
  });
});
