import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { SyncProviderType } from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { MailchimpSyncIntegrationForm } from './mailchimpSyncIntegrationForm';

const create = vi.fn();
const lookup = vi.hoisted(() => vi.fn());

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useLazyQuery: () => [lookup, { data: undefined, loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

beforeEach(() => {
  create.mockReset();
  lookup.mockReset();
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

    fireEvent.click(
      screen.getByRole('button', {
        name: 'integrations.providers.mailchimpMarketing',
      })
    );

    expect(create).toHaveBeenCalledWith({
      variables: {
        id: 'mailchimp-sync',
        type: SyncProviderType.Mailchimp,
        name: 'integrations.providers.mailchimpMarketing',
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
        hidden: true,
        name: 'integrations.mailchimpSyncSettings.listId',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', {
        hidden: true,
        name: 'integrations.mailchimpSyncSettings.defaultInterestGroups',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        hidden: true,
        level: 2,
        name: 'integrations.mailchimpSyncSettings.mergeFieldMappings',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        hidden: true,
        level: 3,
        name: 'integrations.mailchimpSyncSettings.extensions',
      })
    ).toBeInTheDocument();
  });

  describe('interest group mappings', () => {
    const AUTO_ADD = 'integrations.mailchimpSyncSettings.interestGroupAutoAdd';
    const AUTO_REMOVE =
      'integrations.mailchimpSyncSettings.interestGroupAutoRemove';

    // The interest groups are mapped on the wizard's "map" step.
    const renderForm = () => {
      render(
        <ThemeProvider theme={createTheme({ cssVariables: true })}>
          <MailchimpSyncIntegrationForm />
        </ThemeProvider>
      );
      fireEvent.click(step('map'));
    };

    beforeEach(() => {
      (useQuery as unknown as Mock).mockReturnValue({
        data: {
          syncProviderSettings: [
            {
              id: 'mailchimp-sync',
              type: SyncProviderType.Mailchimp,
              name: 'Mailchimp',
              enabled: false,
              mailchimp_isApiKeySet: true,
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

    it('saves an interest group stored without the automatic flags as neither adding nor removing automatically', async () => {
      (useQuery as unknown as Mock).mockReturnValue({
        data: {
          syncProviderSettings: [
            {
              id: 'mailchimp-sync',
              type: SyncProviderType.Mailchimp,
              name: 'Mailchimp',
              enabled: false,
              mailchimp_isApiKeySet: true,
              mailchimp_listId: 'list-1',
              mailchimp_mergeFieldMappings: [],
              mailchimp_interestGroupMappings: [
                { groupId: 'grp-1', expression: 'slug:contains:abo' },
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
      renderForm();

      expect(
        screen.getByRole('checkbox', { name: AUTO_ADD })
      ).not.toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: AUTO_REMOVE })
      ).not.toBeChecked();

      fireEvent.click(step('connect'));
      fireEvent.change(screen.getByRole('textbox', { name: 'name' }), {
        target: { value: 'Mailchimp Newsletter' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'save' }));

      await waitFor(() =>
        expect(create).toHaveBeenCalledWith({
          variables: expect.objectContaining({
            mailchimp_interestGroupMappings: [
              {
                groupId: 'grp-1',
                expression: 'slug:contains:abo',
                autoAdd: false,
                autoRemove: false,
              },
            ],
          }),
        })
      );
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

const renderWith = (setting: Record<string, unknown>) => {
  (useQuery as unknown as Mock).mockReturnValue({
    data: {
      syncProviderSettings: [
        {
          id: 'mailchimp-sync',
          type: SyncProviderType.Mailchimp,
          name: 'Mailchimp',
          enabled: false,
          mailchimp_listId: '',
          ...setting,
        },
      ],
    },
    loading: false,
  });

  return render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MailchimpSyncIntegrationForm />
    </ThemeProvider>
  );
};

const step = (name: string) =>
  screen.getByRole('tab', {
    name: new RegExp(`integrations.mailchimpSyncSettings.stages.${name}\\b`),
  });

describe('MailchimpSyncIntegrationForm stages', () => {
  it('starts with connecting and keeps the later steps closed until then', () => {
    renderWith({});

    expect(step('connect')).toHaveAttribute('aria-selected', 'true');
    expect(step('audience')).toBeDisabled();
    expect(step('map')).toBeDisabled();
    expect(step('sync')).toBeDisabled();
    expect(step('advanced')).toBeDisabled();
    expect(
      screen.getByText('integrations.mailchimpSyncSettings.stages.connectFirst')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /integrations.guide.title/ })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('asks for the audience only once the key is saved, as the list comes from Mailchimp', () => {
    renderWith({});

    expect(
      screen.queryByRole('combobox', {
        name: 'integrations.mailchimpSyncSettings.listId',
      })
    ).toBeNull();

    cleanup();
    renderWith({ mailchimp_isApiKeySet: true });

    expect(step('audience')).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('combobox', {
        name: 'integrations.mailchimpSyncSettings.listId',
      })
    ).toBeVisible();
    expect(step('map')).toBeDisabled();
  });

  it('asks Mailchimp for the audiences only once there is a key to ask with', () => {
    renderWith({});
    expect(lookup).not.toHaveBeenCalled();

    cleanup();
    renderWith({ mailchimp_isApiKeySet: true });
    expect(lookup).toHaveBeenCalledWith({
      variables: { configId: 'mailchimp-sync' },
    });
  });

  it('continues with mapping once the key and the audience are saved', () => {
    renderWith({ mailchimp_isApiKeySet: true, mailchimp_listId: 'abc' });

    expect(step('map')).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'integrations.mailchimpSyncSettings.mergeFieldMappings',
      })
    ).toBeVisible();
  });

  it('moves on with next once a step is done', () => {
    renderWith({ mailchimp_isApiKeySet: true, mailchimp_listId: 'abc' });

    fireEvent.click(screen.getByRole('button', { name: 'wizard.next' }));

    expect(step('sync')).toHaveAttribute('aria-selected', 'true');
  });

  it('runs and monitors the sync on its own step', () => {
    renderWith({ mailchimp_isApiKeySet: true, mailchimp_listId: 'abc' });

    expect(
      screen.queryByRole('button', {
        name: 'integrations.mailchimpSyncSettings.triggerSync',
      })
    ).toBeNull();

    fireEvent.click(step('sync'));

    expect(
      screen.getByRole('button', {
        name: 'integrations.mailchimpSyncSettings.triggerSync',
      })
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole('checkbox', {
          name: /integrations.mailchimpSyncSettings.enabled/,
        })
        .closest('[hidden]')
    ).toBeNull();
  });

  it('opens on the sync step once data is mapped', () => {
    renderWith({
      mailchimp_isApiKeySet: true,
      mailchimp_listId: 'abc',
      mailchimp_mergeFieldMappings: [
        { tag: 'FNAME', expression: 'user.firstName' },
      ],
    });

    expect(step('sync')).toHaveAttribute('aria-selected', 'true');
  });
});
