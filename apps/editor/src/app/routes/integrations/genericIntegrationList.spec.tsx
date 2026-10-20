import { useQuery } from '@apollo/client/react';
import { render, screen } from '@testing-library/react';
import {
  CreateMailProviderSettingDocument,
  MailProviderSettingsDocument,
  UpdateMailProviderSettingDocument,
} from '@wepublish/editor/api';
import type { Mock } from 'vitest';
import { z } from 'zod';

import { GenericIntegrationList } from './genericIntegrationList';

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
  it('offers to set up the integration while none exists', () => {
    mockedUseQuery.mockReturnValue({
      data: { mailProviderSettings: [] },
      loading: false,
    });

    renderList();

    expect(
      screen.getByRole('button', { name: 'integrations.setUp' })
    ).toBeTruthy();
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
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(
      true
    );

    mockedUseQuery.mockReturnValue(setting(false, '2026-01-02T00:00:00.000Z'));
    rerender(list());

    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(
      false
    );
  });
});
