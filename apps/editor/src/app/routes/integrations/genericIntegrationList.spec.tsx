import { useQuery } from '@apollo/client/react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  CreateAnalyticsProviderSettingDocument,
  CreateMailProviderSettingDocument,
  MailProviderSettingsDocument,
  UpdateMailProviderSettingDocument,
} from '@wepublish/editor/api';
import type { Mock } from 'vitest';
import { z } from 'zod';

import { GenericIntegrationList } from './genericIntegrationList';

const mutate = vi.hoisted(() => vi.fn());

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [mutate, { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { provider?: string }) =>
      options?.provider ? `${key}:${options.provider}` : key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const renderList = () =>
  render(
    <GenericIntegrationList
      query={MailProviderSettingsDocument}
      mutation={UpdateMailProviderSettingDocument}
      dataKey="mailProviderSettings"
      schema={z.object({})}
      fields={[]}
      setup={{
        createMutation: CreateMailProviderSettingDocument,
        types: [{ label: 'SMTP', value: 'SMTP' }],
      }}
    />
  );

describe('GenericIntegrationList', () => {
  beforeEach(() => mutate.mockReset().mockResolvedValue({ data: {} }));

  it('offers to set up the integration while none exists', () => {
    mockedUseQuery.mockReturnValue({
      data: { mailProviderSettings: [] },
      loading: false,
    });

    renderList();

    expect(screen.getByRole('button', { name: 'SMTP' })).toBeTruthy();
  });

  it('adds the provider chosen on a first setup right away', async () => {
    mockedUseQuery.mockReturnValue({
      data: { mailProviderSettings: [] },
      loading: false,
    });

    render(
      <GenericIntegrationList
        query={MailProviderSettingsDocument}
        mutation={UpdateMailProviderSettingDocument}
        dataKey="mailProviderSettings"
        schema={z.object({})}
        fields={[]}
        providers={[
          { type: 'MAILGUN', label: 'Mailgun', logo: 'mailgun.svg' },
          { type: 'SMTP', label: 'SMTP server' },
        ]}
        setup={{
          createMutation: CreateMailProviderSettingDocument,
          types: [
            { label: 'Mailgun', value: 'MAILGUN' },
            { label: 'SMTP server', value: 'SMTP' },
          ],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mailgun' }));

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith({
        variables: { id: 'mailgun', type: 'MAILGUN', name: 'Mailgun' },
      })
    );
  });

  const analyticsList = () => (
    <GenericIntegrationList
      query={MailProviderSettingsDocument}
      mutation={UpdateMailProviderSettingDocument}
      dataKey="analyticsProviderSettings"
      schema={z.object({})}
      fields={[]}
      providers={[
        { type: 'GOOGLE', label: 'Google Analytics' },
        { type: 'PLAUSIBLE', label: 'Plausible' },
        { type: 'UMAMI', label: 'Umami' },
      ]}
      fixedProviders={{
        createMutation: CreateAnalyticsProviderSettingDocument,
        providers: [
          { id: 'google-analytics', type: 'GOOGLE' },
          { id: 'plausible', type: 'PLAUSIBLE' },
          { id: 'umami', type: 'UMAMI' },
        ],
      }}
    />
  );

  it('adds a provider with a fixed id under that id', async () => {
    mockedUseQuery.mockReturnValue({
      data: { analyticsProviderSettings: [] },
      loading: false,
    });

    render(analyticsList());
    fireEvent.click(screen.getByRole('button', { name: 'Plausible' }));

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith({
        variables: { id: 'plausible', type: 'PLAUSIBLE', name: 'Plausible' },
      })
    );
  });

  it('offers the providers with a fixed id that are not added yet', () => {
    mockedUseQuery.mockReturnValue({
      data: {
        analyticsProviderSettings: [
          { id: 'google-analytics', type: 'GOOGLE', name: 'Google Analytics' },
        ],
      },
      loading: false,
    });

    render(analyticsList());

    expect(
      screen.getByRole('button', { name: 'integrations.addProvider:Plausible' })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'integrations.addProvider:Umami' })
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', {
        name: 'integrations.addProvider:Google Analytics',
      })
    ).toBeNull();
  });

  it('does not offer a second one once it is set up', () => {
    mockedUseQuery.mockReturnValue({
      data: {
        mailProviderSettings: [{ id: 'smtp', type: 'SMTP', name: 'SMTP' }],
      },
      loading: false,
    });

    renderList();

    expect(
      screen.queryByRole('button', { name: 'integrations.setUp' })
    ).toBeNull();
  });
  it('shows a setting that was changed by saving another one', () => {
    const setting = (hotAndTrending: boolean, modifiedAt: string) => ({
      data: {
        analyticsProviderSettings: [
          {
            id: 'google-analytics',
            type: 'GOOGLE',
            name: 'Google Analytics',
            hotAndTrending,
            modifiedAt,
          },
        ],
      },
      loading: false,
    });
    const list = () => (
      <GenericIntegrationList
        query={MailProviderSettingsDocument}
        mutation={UpdateMailProviderSettingDocument}
        dataKey="analyticsProviderSettings"
        schema={z.object({ hotAndTrending: z.boolean().nullish() })}
        fields={[
          {
            name: 'hotAndTrending',
            label: 'integrations.analyticsSettings.hotAndTrending',
            type: 'checkbox',
          },
        ]}
      />
    );

    mockedUseQuery.mockReturnValue(setting(true, '2026-01-01T00:00:00.000Z'));
    const { rerender } = render(list());
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true);

    mockedUseQuery.mockReturnValue(setting(false, '2026-01-02T00:00:00.000Z'));
    rerender(list());

    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(
      false
    );
  });

  it('labels the fields of the set-up dialog', () => {
    mockedUseQuery.mockReturnValue({
      data: { mailProviderSettings: [] },
      loading: false,
    });

    renderList();
    fireEvent.click(
      screen.getByRole('button', { name: 'integrations.empty.more' })
    );

    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByRole('combobox', { name: 'integrations.addType' })
    ).toBeTruthy();
    expect(
      within(dialog).getByRole('textbox', { name: 'integrations.addId' })
    ).toHaveAccessibleDescription('integrations.addIdHelp');
  });

  it('labels the search once there are several integrations', () => {
    mockedUseQuery.mockReturnValue({
      data: {
        mailProviderSettings: ['a', 'b', 'c', 'd'].map(id => ({
          id,
          type: 'SMTP',
          name: id,
        })),
      },
      loading: false,
    });

    renderList();

    expect(screen.getByRole('textbox', { name: 'search' })).toBeTruthy();
  });

  it('welcomes a first setup with the providers to choose from', () => {
    mockedUseQuery.mockReturnValue({
      data: { mailProviderSettings: [] },
      loading: false,
    });

    render(
      <GenericIntegrationList
        query={MailProviderSettingsDocument}
        mutation={UpdateMailProviderSettingDocument}
        dataKey="mailProviderSettings"
        schema={z.object({})}
        fields={[]}
        providers={[
          { type: 'MAILGUN', label: 'Mailgun', logo: 'mailgun.svg' },
          { type: 'SMTP', label: 'SMTP server' },
          { type: 'LOG', label: 'Log only', testing: true },
        ]}
        setup={{
          createMutation: CreateMailProviderSettingDocument,
          types: [
            { label: 'Mailgun', value: 'MAILGUN' },
            { label: 'SMTP server', value: 'SMTP' },
            { label: 'Log only', value: 'LOG' },
          ],
        }}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'integrations.empty.title' })
    ).toBeInTheDocument();
    expect(screen.getByText('integrations.empty.description')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mailgun' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SMTP server' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Log only')).toBeNull();
  });

  it('does not offer a choice when there is only one provider', () => {
    mockedUseQuery.mockReturnValue({
      data: { mailProviderSettings: [] },
      loading: false,
    });

    render(
      <GenericIntegrationList
        query={MailProviderSettingsDocument}
        mutation={UpdateMailProviderSettingDocument}
        dataKey="mailProviderSettings"
        schema={z.object({})}
        fields={[]}
        providers={[{ type: 'V0', label: 'v0 by Vercel' }]}
      />
    );

    expect(
      screen.getByText('integrations.empty.descriptionSingle')
    ).toBeTruthy();
  });
});
