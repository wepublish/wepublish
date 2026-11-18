import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SyncProviderType } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { MailchimpSyncIntegrationForm } from './mailchimpSyncIntegrationForm';

const create = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useLazyQuery: () => [vi.fn(), { data: undefined, loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

beforeEach(() => {
  create.mockReset();
  (useMutation as unknown as Mock).mockReturnValue([
    create,
    { loading: false },
  ]);
  (useQuery as unknown as Mock).mockReturnValue({
    data: { syncProviderSettings: [] },
    loading: false,
  });
});

const renderForm = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <MailchimpSyncIntegrationForm />
      </MemoryRouter>
    </ThemeProvider>
  );

const givenProvider = () =>
  (useQuery as unknown as Mock).mockReturnValue({
    data: {
      syncProviderSettings: [
        {
          id: 'mailchimp-sync',
          type: SyncProviderType.Mailchimp,
          name: 'Mailchimp',
          enabled: true,
          mailchimp_listId: 'list-1',
          newslettersInProfile: true,
          newsletters: [
            {
              id: 'n1',
              interestId: 'a',
              name: 'Morgen-Briefing',
              description: null,
              image: null,
            },
          ],
        },
      ],
    },
    loading: false,
  });

describe('MailchimpSyncIntegrationForm', () => {
  it('leaves the newsletters to the newsletters page', () => {
    givenProvider();
    renderForm();

    expect(
      screen.queryByText('integrations.mailchimpSyncSettings.newsletters')
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'newsletterSettings.title' })
    ).toHaveAttribute('href', '/newsletters');
  });

  it('keeps the newsletters when saving the integration', async () => {
    givenProvider();
    const { container } = renderForm();

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0].variables).not.toHaveProperty('newsletters');
    expect(create.mock.calls[0][0].variables).not.toHaveProperty(
      'newslettersInProfile'
    );
  });

  it('sets up the Mailchimp sync while none exists', () => {
    render(<MailchimpSyncIntegrationForm />);

    fireEvent.click(screen.getByRole('button', { name: 'integrations.setUp' }));

    expect(create).toHaveBeenCalledWith({
      variables: {
        id: 'mailchimp-sync',
        type: SyncProviderType.Mailchimp,
        name: 'Mailchimp',
      },
    });
  });

  it('names the fields and nests the section headings under the page title', () => {
    (useQuery as unknown as Mock).mockReturnValue({
      data: {
        syncProviderSettings: [
          {
            id: 'mailchimp-sync',
            type: SyncProviderType.Mailchimp,
            name: 'Mailchimp',
            enabled: false,
            mailchimp_listId: '',
          },
        ],
      },
      loading: false,
    });

    renderForm();

    expect(screen.getByRole('textbox', { name: 'name' })).toBeInTheDocument();
    expect(
      screen.getByLabelText('integrations.mailchimpSyncSettings.apiKey', {
        selector: 'input',
      })
    ).toHaveAttribute('name', 'mailchimp_apiKey');
    expect(
      screen.getByRole('combobox', {
        name: 'integrations.mailchimpSyncSettings.listId',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', {
        name: 'integrations.mailchimpSyncSettings.defaultInterestGroups',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'integrations.mailchimpSyncSettings.mergeFieldMappings',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'integrations.mailchimpSyncSettings.extensions',
      })
    ).toBeInTheDocument();
  });
});
