import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
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

    render(<LetterIntegrationForm />);

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
});
