import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { PaymentMethodList } from './paymentMethodList';

const theme = createTheme({ cssVariables: true });

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

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  PaymentMethodEditPanel: ({
    id,
    onClose,
  }: {
    id?: string;
    onClose: () => void;
  }) => (
    <button
      type="button"
      onClick={onClose}
    >
      {`close ${id ?? 'new'}`}
    </button>
  ),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const renderAt = (path: string) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {[
            '/paymentmethods',
            '/paymentmethods/create',
            '/paymentmethods/edit/:id',
          ].map(route => (
            <Route
              key={route}
              path={route}
              element={<PaymentMethodList />}
            />
          ))}
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: {
      paymentMethods: [
        {
          id: 'pm-1',
          name: 'Test',
          paymentProvider: { id: 'stripe', name: 'Stripe' },
        },
      ],
    },
    loading: false,
    refetch: vi.fn(),
  });
});

describe('PaymentMethodList', () => {
  it('opens the edit drawer again for a payment method that was just closed', async () => {
    renderAt('/paymentmethods/edit/pm-1');

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'close pm-1',
      })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByRole('link', { name: 'Test' }));

    expect(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'close pm-1',
      })
    ).toBeInTheDocument();
  });
});
