import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ConsentsDocument, UserListDocument } from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { UserConsentForm, UserConsentFormValues } from './user-consent-form';

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

const WithForm = ({
  values,
  children,
}: {
  values: UserConsentFormValues;
  children: ReactNode;
}) => {
  const form = useForm<UserConsentFormValues>({ defaultValues: values });

  return (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <FormProvider {...form}>{children}</FormProvider>
    </ThemeProvider>
  );
};

describe('UserConsentForm', () => {
  it('shows the user and the consent of an existing user consent', () => {
    render(
      <WithForm
        values={{ userId: 'user-1', consentId: 'consent-1', value: true }}
      >
        <UserConsentForm isEdit />
      </WithForm>
    );

    expect(screen.getByDisplayValue('Erika Muster')).toBeTruthy();
    expect(screen.getByDisplayValue('Newsletter')).toBeTruthy();
  });

  it('labels the user and consent pickers', () => {
    render(
      <WithForm values={{ userId: '', consentId: '', value: false }}>
        <UserConsentForm />
      </WithForm>
    );

    expect(
      screen.getByRole('combobox', { name: 'dashboard.user' })
    ).toBeTruthy();
    expect(
      screen.getByRole('combobox', { name: 'consents.consent' })
    ).toBeTruthy();
  });
});
