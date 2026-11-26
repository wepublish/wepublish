import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { LetterIntegrationForm } from './letterIntegrationForm';

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

// The info triggers read their colours from the theme's css variables.
const renderForm = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <LetterIntegrationForm />
    </ThemeProvider>
  );

describe('LetterIntegrationForm', () => {
  it('offers the print defaults for automated letters', () => {
    mockedUseQuery.mockReturnValue({
      data: {
        letterProviderSettings: [
          { id: 'pingen', type: 'pingen', name: 'Pingen', autoSend: false },
        ],
      },
      loading: false,
    });

    renderForm();

    for (const field of [
      'defaultAddressPosition',
      'defaultDeliveryProduct',
      'defaultPrintMode',
      'defaultPrintSpectrum',
    ]) {
      expect(
        screen.getByText(`integrations.letterSettings.${field}`)
      ).toBeTruthy();
    }
  });

  // What the switch means is not obvious from its label: it also decides
  // what happens to a letter the print vendor holds back.
  it('explains what sending automatically means', () => {
    mockedUseQuery.mockReturnValue({
      data: {
        letterProviderSettings: [
          { id: 'pingen', type: 'pingen', name: 'Pingen', autoSend: false },
        ],
      },
      loading: false,
    });

    renderForm();

    expect(
      screen.getByLabelText('integrations.letterSettings.autoSendInfo')
    ).toBeTruthy();
  });
});
