import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { render, screen } from '@testing-library/react';
import { ConsentsDocument, UserListDocument } from '@wepublish/editor/api';

import { UserConsentForm } from './user-consent-form';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

beforeEach(() => {
  const results = new Map<unknown, unknown>([
    [
      UserListDocument,
      { users: { nodes: [{ id: 'user-1', name: 'Erika Muster' }] } },
    ],
    [ConsentsDocument, { consents: [{ id: 'consent-1', name: 'Newsletter' }] }],
  ]);

  mockedUseQuery.mockImplementation((document: unknown) => ({
    data: results.get(document),
    loading: false,
  }));
});

describe('UserConsentForm', () => {
  it('shows the user and the consent of an existing user consent', () => {
    render(
      <UserConsentForm
        isEdit
        userConsent={{ userId: 'user-1', consentId: 'consent-1', value: true }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Erika Muster')).toBeTruthy();
    expect(screen.getByText('Newsletter')).toBeTruthy();
  });
});
