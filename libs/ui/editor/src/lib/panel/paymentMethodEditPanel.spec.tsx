import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PaymentProviderListDocument } from '@wepublish/editor/api';
import { CanCreatePaymentMethod } from '@wepublish/permissions';
import type { Mock } from 'vitest';

import { AuthContext } from '../authContext';
import { PaymentMethodEditPanel } from './paymentMethodEditPanel';

const save = vi.fn(async () => ({
  data: {
    updatePaymentMethod: paymentMethod,
    createPaymentMethod: paymentMethod,
  },
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [save, { loading: false }],
  useApolloClient: () => ({
    query: vi.fn(async () => ({ data: { paymentMethod } })),
  }),
}));

const paymentMethod = {
  id: 'pm-1',
  name: 'Invoice',
  slug: 'invoice',
  description: 'Pay by invoice',
  active: true,
  gracePeriod: 14,
  paymentProvider: { id: 'bexio', name: 'Bexio' },
  image: null,
};

const providers = [
  { id: 'bexio', name: 'Bexio' },
  { id: 'stripe', name: 'Stripe' },
];

const theme = createTheme({ cssVariables: true });

const session = {
  sessionRoles: [
    { id: 'role', name: 'admin', permissions: [CanCreatePaymentMethod] },
  ],
} as never;

const renderPanel = (id?: string) =>
  render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider value={{ session }}>
        <PaymentMethodEditPanel id={id} />
      </AuthContext.Provider>
    </ThemeProvider>
  );

describe('PaymentMethodEditPanel', () => {
  beforeEach(() => {
    save.mockClear();
    (useQuery as Mock).mockImplementation(document => ({
      data:
        document === PaymentProviderListDocument ?
          { paymentProviders: providers }
        : undefined,
      loading: false,
    }));
  });

  it('opens on the values of the method it was given', async () => {
    renderPanel('pm-1');

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(
        'Invoice'
      )
    );
    expect(screen.getByRole('textbox', { name: /slug/i })).toHaveValue(
      'invoice'
    );
  });

  it('starts blank when there is nothing to edit', async () => {
    renderPanel();

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue('')
    );
  });

  it('follows the name with a slug', async () => {
    renderPanel();

    await waitFor(() => screen.getByRole('textbox', { name: /name/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'Twint Pay' },
    });

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /slug/i })).toHaveValue(
        'twint-pay'
      )
    );
  });

  it('refuses to save without a name', async () => {
    renderPanel();

    await waitFor(() => screen.getByRole('combobox', { name: /adapter/i }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /adapter/i }));
    fireEvent.click(await screen.findByRole('option', { name: 'Bexio' }));

    fireEvent.click(screen.getByRole('button', { name: /^(save|create)$/ }));

    await waitFor(() =>
      expect(
        screen.getByText('errorMessages.noNameErrorMessage')
      ).toBeInTheDocument()
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('saves what the form holds', async () => {
    renderPanel('pm-1');

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(
        'Invoice'
      )
    );
    fireEvent.click(screen.getByRole('button', { name: /^(save|create)$/ }));

    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0].variables).toMatchObject({
      id: 'pm-1',
      name: 'Invoice',
      slug: 'invoice',
      gracePeriod: 14,
      paymentProviderID: 'bexio',
    });
  });
});

describe('panel layout', () => {
  it('keeps the flex chain from the drawer down to the body', async () => {
    const { container } = renderPanel('pm-1');

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(
        'Invoice'
      )
    );

    expect(container.querySelector('form')).toHaveStyle({
      display: 'flex',
      'flex-direction': 'column',
      'min-height': '0',
    });
  });
});
