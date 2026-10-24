import { useApolloClient, useMutation } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  MemberPlanDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { GiftCodeOfferEditView } from './giftCodeOfferEditView';

const theme = createTheme({ cssVariables: true });

const plan = {
  id: 'plan-1',
  name: 'Jahresabo',
  currency: 'CHF',
  periodicityPricing: [
    {
      periodicity: PaymentPeriodicity.Yearly,
      amountMin: 9000,
      amountTarget: 12000,
      amountMax: null,
    },
  ],
  availablePaymentMethods: [],
};

const offer = {
  __typename: 'GiftCodeOffer',
  id: 'offer-1',
  createdAt: '2026-10-01T10:00:00.000Z',
  modifiedAt: '2026-10-02T10:00:00.000Z',
  name: 'Ein Jahr schenken',
  description: null,
  active: true,
  issueBeforePayment: false,
  periodicity: PaymentPeriodicity.Yearly,
  redemptionWindowMonths: 12,
  imageID: null,
  image: null,
  memberPlanId: 'plan-1',
  memberPlan: { id: 'plan-1', name: 'Jahresabo', currency: 'CHF' },
  paymentMethodIds: ['method-1'],
  paymentMethods: [{ id: 'method-1', name: 'Stripe', slug: 'stripe' }],
  price: { amount: 12000, currency: 'CHF' },
};

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: vi.fn(),
  useApolloClient: vi.fn(),
  useQuery: (document: unknown) => {
    if (document === MemberPlanDocument) {
      return { data: { memberPlan: plan }, loading: false };
    }

    if (document === PaymentMethodListDocument) {
      return {
        data: {
          paymentMethods: [
            { id: 'method-1', name: 'Stripe', slug: 'stripe', active: true },
          ],
        },
        loading: false,
      };
    }

    return { data: undefined, loading: false };
  },
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: () => ({ id: 'offer-1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent: () => (component: unknown) => component,
  RichTextBlock: () => null,
  SelectMemberPlan: () => null,
}));

const mockedUseMutation = useMutation as unknown as Mock;
const mockedUseApolloClient = useApolloClient as unknown as Mock;
const updateOffer = vi.fn();
const query = vi.fn();

const renderView = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <GiftCodeOfferEditView />
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  updateOffer.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([updateOffer, { loading: false }]);

  query.mockReset();
  query.mockResolvedValue({ data: { giftCodeOffer: offer } });
  mockedUseApolloClient.mockReturnValue({ query });
});

describe('GiftCodeOfferEditView', () => {
  it('opens on the offer it was asked for', async () => {
    renderView();

    expect(
      await screen.findByDisplayValue('Ein Jahr schenken')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(
      screen.getByText('giftCodeOffer.form.currentPrice:120.00 CHF')
    ).toBeInTheDocument();
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'offer-1' } })
    );
  });

  it('renders nothing until the offer has loaded', () => {
    query.mockReturnValue(new Promise(() => undefined));

    const { container } = renderView();

    expect(container).toBeEmptyDOMElement();
  });

  it('saves what was edited and keeps the rest', async () => {
    renderView();

    fireEvent.change(await screen.findByDisplayValue('Ein Jahr schenken'), {
      target: { value: 'Ein Jahr Lesefreude' },
    });
    fireEvent.change(
      screen.getByLabelText('giftCodeOffer.form.redemptionWindowMonths'),
      { target: { value: '' } }
    );
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updateOffer).toHaveBeenCalledWith({
        variables: {
          id: 'offer-1',
          name: 'Ein Jahr Lesefreude',
          description: null,
          active: true,
          issueBeforePayment: false,
          memberPlanId: 'plan-1',
          periodicity: PaymentPeriodicity.Yearly,
          redemptionWindowMonths: null,
          imageID: null,
          paymentMethodIds: ['method-1'],
        },
      })
    );
  });
});
