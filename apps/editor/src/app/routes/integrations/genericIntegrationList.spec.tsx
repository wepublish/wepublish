import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { render, screen } from '@testing-library/react';
import {
  CreateMailProviderSettingDocument,
  MailProviderSettingsDocument,
  UpdateMailProviderSettingDocument,
} from '@wepublish/editor/api';
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
});
