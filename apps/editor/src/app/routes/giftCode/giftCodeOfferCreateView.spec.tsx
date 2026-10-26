import { useMutation } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  MemberPlanDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { GiftCodeOfferCreateView } from './giftCodeOfferCreateView';

const theme = createTheme({ cssVariables: true });

const navigate = vi.fn();

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
    {
      periodicity: PaymentPeriodicity.Monthly,
      amountMin: 1000,
      amountTarget: null,
      amountMax: null,
    },
    {
      periodicity: PaymentPeriodicity.Quarterly,
      amountMin: 0,
      amountTarget: null,
      amountMax: null,
    },
  ],
  availablePaymentMethods: [],
};

const paymentMethods = [
  { id: 'method-1', name: 'Stripe', slug: 'stripe', active: true },
  { id: 'method-2', name: 'Payrexx', slug: 'payrexx', active: true },
];

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: vi.fn(),
  useQuery: (document: unknown, options?: { skip?: boolean }) => {
    if (options?.skip) {
      return { data: undefined, loading: false };
    }

    if (document === MemberPlanDocument) {
      return { data: { memberPlan: plan }, loading: false };
    }

    if (document === PaymentMethodListDocument) {
      return { data: { paymentMethods }, loading: false };
    }

    return { data: undefined, loading: false };
  },
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
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
  SelectMemberPlan: ({
    setSelectedMemberPlan,
  }: {
    setSelectedMemberPlan(id: string | null): void;
  }) => (
    <button
      type="button"
      aria-label="pick plan"
      onClick={() => setSelectedMemberPlan('plan-1')}
    />
  ),
}));

const mockedUseMutation = useMutation as unknown as Mock;
const createOffer = vi.fn();

const renderView = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <GiftCodeOfferCreateView />
      </MemoryRouter>
    </ThemeProvider>
  );

const choosePeriodicity = (periodicity: PaymentPeriodicity) => {
  fireEvent.mouseDown(
    screen.getByRole('combobox', { name: 'giftCodeOffer.form.periodicity' })
  );
  fireEvent.click(
    within(screen.getByRole('listbox')).getByRole('option', {
      name: `memberPlanList.paymentPeriodicity.${periodicity}`,
    })
  );
};

const choosePaymentMethod = (name: string) => {
  fireEvent.mouseDown(
    screen.getByRole('combobox', { name: 'giftCodeOffer.form.paymentMethods' })
  );
  fireEvent.click(screen.getByRole('option', { name }));
};

beforeEach(() => {
  navigate.mockReset();
  createOffer.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([createOffer, { loading: false }]);
});

describe('GiftCodeOfferCreateView', () => {
  it('shows active as a ticked checkbox next to the sales settings', () => {
    renderView();

    const active = screen.getByRole('checkbox', {
      name: 'giftCodeOffer.form.active',
    });

    expect(active).toBeChecked();
    expect(active.closest('.MuiCard-root')).toBe(
      screen
        .getByRole('combobox', { name: 'giftCodeOffer.form.paymentMethods' })
        .closest('.MuiCard-root')
    );
  });

  it('creates an inactive offer once active is unticked', async () => {
    renderView();

    fireEvent.change(screen.getByLabelText('giftCodeOffer.form.name'), {
      target: { value: 'Ein Jahr schenken' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'pick plan' }));
    choosePeriodicity(PaymentPeriodicity.Yearly);
    choosePaymentMethod('Stripe');
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'giftCodeOffer.form.active' })
    );
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(createOffer).toHaveBeenCalledWith({
        variables: expect.objectContaining({ active: false }),
      })
    );
  });

  it('offers only the durations the plan has a price for', () => {
    renderView();

    fireEvent.click(screen.getByRole('button', { name: 'pick plan' }));
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'giftCodeOffer.form.periodicity' })
    );

    const options = within(screen.getByRole('listbox'))
      .getAllByRole('option')
      .map(option => option.textContent);

    expect(options).toEqual([
      'memberPlanList.paymentPeriodicity.yearly',
      'memberPlanList.paymentPeriodicity.monthly',
    ]);
  });

  it('shows the price the buyer pays for the chosen duration', () => {
    renderView();

    fireEvent.click(screen.getByRole('button', { name: 'pick plan' }));
    choosePeriodicity(PaymentPeriodicity.Yearly);

    expect(
      screen.getByText('giftCodeOffer.form.currentPrice:120.00 CHF')
    ).toBeInTheDocument();
  });

  it('will not create an offer without a payment method', async () => {
    renderView();

    fireEvent.change(screen.getByLabelText('giftCodeOffer.form.name'), {
      target: { value: 'Ein Jahr schenken' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'pick plan' }));
    choosePeriodicity(PaymentPeriodicity.Yearly);
    fireEvent.click(screen.getByTestId('saveButton'));

    expect(
      await screen.findByText('giftCodeOffer.form.paymentMethodsRequired')
    ).toBeInTheDocument();
    expect(createOffer).not.toHaveBeenCalled();
  });

  it('creates the offer with what was entered', async () => {
    renderView();

    fireEvent.change(screen.getByLabelText('giftCodeOffer.form.name'), {
      target: { value: 'Ein Jahr schenken' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'pick plan' }));
    choosePeriodicity(PaymentPeriodicity.Yearly);
    fireEvent.change(
      screen.getByLabelText('giftCodeOffer.form.redemptionWindowMonths'),
      { target: { value: '12' } }
    );
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'giftCodeOffer.form.issueBeforePayment',
      })
    );
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'giftCodeOffer.form.allowDiscountCodes',
      })
    );
    choosePaymentMethod('Payrexx');
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(createOffer).toHaveBeenCalledWith({
        variables: {
          name: 'Ein Jahr schenken',
          description: null,
          active: true,
          issueBeforePayment: true,
          allowDiscountCodes: true,
          memberPlanId: 'plan-1',
          periodicity: PaymentPeriodicity.Yearly,
          redemptionWindowMonths: 12,
          imageID: null,
          paymentMethodIds: ['method-2'],
        },
      })
    );
  });

  it('opens the new offer once it is created', () => {
    renderView();

    const { onCompleted } = mockedUseMutation.mock.calls.at(-1)![1];
    onCompleted({ createGiftCodeOffer: { id: 'offer-1' } });

    expect(navigate).toHaveBeenCalledWith('./../edit/offer-1');
  });
});
