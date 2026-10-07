import type { Mock } from 'vitest';
import { useMutation, useQuery } from '@apollo/client/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SyncProviderType } from '@wepublish/editor/api';

import { MailchimpSyncIntegrationForm } from './mailchimpSyncIntegrationForm';

const create = vi.fn();

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
});
