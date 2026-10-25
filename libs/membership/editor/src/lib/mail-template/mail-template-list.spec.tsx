import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { AuthContext, sessionWithPermissions } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { MailTemplateList } from './mail-template-list';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(() => ({
    data: {
      mailTemplates: [
        {
          id: '1',
          name: 'Welcome',
          description: null,
          subject: 'Hello',
          context: null,
          status: 'ok',
        },
      ],
    },
    loading: false,
  })),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderList = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MailTemplateList />
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

describe('MailTemplateList', () => {
  it('keeps the help text out of the column header names', () => {
    renderList();

    for (const header of [
      'mailTemplates.edit.mailType',
      'mailTemplates.status',
    ]) {
      expect(
        within(screen.getByRole('columnheader', { name: header })).getByRole(
          'button',
          { name: 'moreInfo' }
        )
      ).toBeTruthy();
    }
  });

  it('says so in the table when there are no templates', () => {
    (useQuery as unknown as Mock).mockReturnValueOnce({
      data: { mailTemplates: [] },
      loading: false,
    });

    renderList();

    expect(
      screen
        .getByRole('cell', { name: 'mailTemplates.empty' })
        .getAttribute('colspan')
    ).toBe('6');
  });

  it('names the ok status in words', () => {
    renderList();

    expect(screen.getByRole('img', { name: 'ok' })).toBeTruthy();
  });
});
