import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SyncProviderType } from '@wepublish/editor/api';
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

describe('MailchimpSyncIntegrationForm', () => {
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

    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <MailchimpSyncIntegrationForm />
      </ThemeProvider>
    );

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

  describe('interest group mappings', () => {
    const AUTO_ADD = 'integrations.mailchimpSyncSettings.interestGroupAutoAdd';
    const AUTO_REMOVE =
      'integrations.mailchimpSyncSettings.interestGroupAutoRemove';

    const renderForm = () =>
      render(
        <ThemeProvider theme={createTheme({ cssVariables: true })}>
          <MailchimpSyncIntegrationForm />
        </ThemeProvider>
      );

    beforeEach(() => {
      (useQuery as unknown as Mock).mockReturnValue({
        data: {
          syncProviderSettings: [
            {
              id: 'mailchimp-sync',
              type: SyncProviderType.Mailchimp,
              name: 'Mailchimp',
              enabled: false,
              mailchimp_listId: 'list-1',
              mailchimp_mergeFieldMappings: [],
              mailchimp_interestGroupMappings: [
                {
                  groupId: 'grp-1',
                  expression: 'slug:contains:abo',
                  autoAdd: true,
                  autoRemove: true,
                },
              ],
              mailchimp_defaultInterestGroupIds: [],
              mailchimp_extensions: {},
              lastSyncAt: null,
              lastSyncError: null,
            },
          ],
        },
        loading: false,
      });
    });

    it('adds and removes interest groups automatically unless told otherwise', () => {
      renderForm();

      fireEvent.click(
        screen.getByRole('button', {
          name: 'integrations.mailchimpSyncSettings.addInterestGroup',
        })
      );

      const checkboxes = [
        ...screen.getAllByRole('checkbox', { name: AUTO_ADD }),
        ...screen.getAllByRole('checkbox', { name: AUTO_REMOVE }),
      ];
      expect(checkboxes).toHaveLength(4);
      for (const checkbox of checkboxes) {
        expect(checkbox).toBeChecked();
      }
    });

    it('saves an interest group that is no longer removed automatically', async () => {
      renderForm();

      fireEvent.click(screen.getByRole('checkbox', { name: AUTO_REMOVE }));
      fireEvent.click(screen.getByRole('button', { name: 'save' }));

      await waitFor(() =>
        expect(create).toHaveBeenCalledWith({
          variables: expect.objectContaining({
            mailchimp_interestGroupMappings: [
              {
                groupId: 'grp-1',
                expression: 'slug:contains:abo',
                autoAdd: true,
                autoRemove: false,
              },
            ],
          }),
        })
      );
    });
  });
});
