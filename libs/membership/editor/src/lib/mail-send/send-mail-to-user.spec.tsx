import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { SendMailToUserPanel } from './send-mail-to-user';

const queries = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    queries(operationName(document), options),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SendMailToUserPanel', () => {
  beforeEach(() => {
    queries.mockImplementation((name: string) =>
      name === 'MailTemplate' ?
        {
          data: {
            mailTemplates: [
              { id: 'tpl-1', name: 'Willkommen', channels: ['mail'] },
              { id: 'tpl-2', name: 'Begleitbrief', channels: ['letter'] },
            ],
          },
        }
      : { data: undefined }
    );
  });

  it('offers only templates with an email version: this sends an email', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <SendMailToUserPanel userId="user-1" />
      </ThemeProvider>
    );

    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual(['Willkommen']);
  });
});
