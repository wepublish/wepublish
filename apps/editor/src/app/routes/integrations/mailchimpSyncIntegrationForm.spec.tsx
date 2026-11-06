import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  MailchimpInterestGroupsDocument,
  MailchimpListsDocument,
  MailchimpMergeFieldsDocument,
  SyncProviderSettingsDocument,
  SyncProviderType,
  UpdateSyncProviderSettingDocument,
} from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { MailchimpSyncIntegrationForm } from './mailchimpSyncIntegrationForm';

const create = vi.fn();
/** What each query answers with; an `Error` makes the query fail. */
const queryStore = new Map<unknown, unknown>();

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const setting = {
  id: 'mailchimp-sync',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  lastLoadedAt: '2026-01-01T00:00:00.000Z',
  type: SyncProviderType.Mailchimp,
  name: 'Mailchimp',
  enabled: false,
  mailchimp_listId: 'list-1',
  mailchimp_mergeFieldMappings: [
    { tag: 'FNAME', expression: 'user.firstName' },
  ],
  mailchimp_interestGroupMappings: [
    { groupId: 'grp-1', expression: 'slug:contains:abo' },
  ],
  mailchimp_defaultInterestGroupIds: [],
  mailchimp_extensions: {},
  lastSyncAt: null,
  lastSyncError: null,
};

const givenMailchimpLists = () =>
  queryStore.set(MailchimpListsDocument, {
    mailchimpLists: [
      { id: 'list-1', name: 'Newsletter', memberCount: 1200 },
      { id: 'list-2', name: 'Archive', memberCount: 3 },
    ],
  });

const givenMailchimpListDetails = () => {
  queryStore.set(MailchimpMergeFieldsDocument, {
    mailchimpMergeFields: [{ tag: 'FNAME', name: 'First name', type: 'text' }],
  });
  queryStore.set(MailchimpInterestGroupsDocument, {
    mailchimpInterestGroups: [{ id: 'grp-1', name: 'Topics: Politics' }],
  });
};

const renderForm = () => {
  const ui = () => (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MailchimpSyncIntegrationForm />
    </ThemeProvider>
  );
  const { rerender } = render(ui());

  return { rerender: () => rerender(ui()) };
};

beforeEach(() => {
  create.mockReset();
  queryStore.clear();
  (useMutation as unknown as Mock).mockReturnValue([
    create,
    { loading: false },
  ]);
  (useQuery as unknown as Mock).mockImplementation(
    (document: unknown, options?: { skip?: boolean }) => {
      const answer = options?.skip ? undefined : queryStore.get(document);

      return answer instanceof Error ?
          { data: undefined, error: answer, loading: false }
        : { data: answer, loading: false };
    }
  );
});

describe('MailchimpSyncIntegrationForm', () => {
  it('sets up the Mailchimp sync while none exists', () => {
    queryStore.set(SyncProviderSettingsDocument, { syncProviderSettings: [] });
    renderForm();

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
    queryStore.set(SyncProviderSettingsDocument, {
      syncProviderSettings: [setting],
    });
    givenMailchimpLists();
    givenMailchimpListDetails();
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

  it('names the saved merge field and interest group as soon as Mailchimp answers', () => {
    queryStore.set(SyncProviderSettingsDocument, {
      syncProviderSettings: [setting],
    });
    givenMailchimpLists();
    const { rerender } = renderForm();

    expect(screen.getByDisplayValue('Newsletter (list-1)')).toBeTruthy();
    expect(screen.getByDisplayValue('FNAME')).toBeTruthy();

    givenMailchimpListDetails();
    rerender();

    expect(screen.getByDisplayValue('First name (FNAME)')).toBeTruthy();
    expect(screen.getByDisplayValue('Topics: Politics (grp-1)')).toBeTruthy();
  });

  it('keeps a typed list ID as typed and names it once the field is left', () => {
    queryStore.set(SyncProviderSettingsDocument, {
      syncProviderSettings: [setting],
    });
    givenMailchimpLists();
    givenMailchimpListDetails();
    renderForm();

    const listInput = screen.getByDisplayValue(
      'Newsletter (list-1)'
    ) as HTMLInputElement;
    fireEvent.focus(listInput);
    fireEvent.change(listInput, { target: { value: 'list-2' } });

    expect(listInput.value).toBe('list-2');

    fireEvent.blur(listInput);

    expect(listInput.value).toBe('Archive (list-2)');
  });

  describe('while the saved API key does not work', () => {
    beforeEach(() => {
      queryStore.set(SyncProviderSettingsDocument, {
        syncProviderSettings: [setting],
      });
      queryStore.set(
        MailchimpListsDocument,
        new Error('API Key Invalid: Your API key may be invalid.')
      );
      givenMailchimpListDetails();
    });

    it('says why instead of showing the audience, merge field and interest group inputs', () => {
      renderForm();

      expect(
        screen.getByText('integrations.mailchimpSyncSettings.saveWorkingApiKey')
      ).toBeTruthy();
      expect(
        screen.getByText('API Key Invalid: Your API key may be invalid.')
      ).toBeTruthy();
      expect(
        screen.queryByPlaceholderText(
          'integrations.mailchimpSyncSettings.listId'
        )
      ).toBeNull();
      for (const section of [
        'mergeFieldMappings',
        'interestGroupMappings',
        'defaultInterestGroups',
        'extensions',
      ]) {
        expect(
          screen.queryByText(`integrations.mailchimpSyncSettings.${section}`)
        ).toBeNull();
      }
    });

    it('asks Mailchimp again on save, so a fixed key shows the inputs', () => {
      const { rerender } = renderForm();

      expect(useMutation).toHaveBeenCalledWith(
        UpdateSyncProviderSettingDocument,
        expect.objectContaining({
          refetchQueries: expect.arrayContaining([MailchimpListsDocument]),
        })
      );

      givenMailchimpLists();
      rerender();

      expect(screen.getByDisplayValue('Newsletter (list-1)')).toBeTruthy();
      expect(screen.getByDisplayValue('First name (FNAME)')).toBeTruthy();
      expect(screen.getByDisplayValue('Topics: Politics (grp-1)')).toBeTruthy();
    });
  });
});
