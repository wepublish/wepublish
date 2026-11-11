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
  extendable: true,
  availablePaymentMethods: [
    {
      paymentMethods: [
        { id: 'method-3', name: 'Rechnung', active: true },
        { id: 'method-5', name: 'Alte Karte', active: false },
      ],
      paymentPeriodicities: [PaymentPeriodicity.Yearly],
      forceAutoRenewal: false,
    },
    {
      paymentMethods: [{ id: 'method-4', name: 'Twint', active: true }],
      paymentPeriodicities: [PaymentPeriodicity.Monthly],
      forceAutoRenewal: true,
    },
    {
      paymentMethods: [{ id: 'method-3', name: 'Rechnung', active: true }],
      paymentPeriodicities: [
        PaymentPeriodicity.Monthly,
        PaymentPeriodicity.Quarterly,
        PaymentPeriodicity.Yearly,
      ],
      forceAutoRenewal: false,
    },
  ],
};

let planOverrides: Record<string, unknown> = {};

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
      return {
        data: { memberPlan: { ...plan, ...planOverrides } },
        loading: false,
      };
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

const fillRequiredFields = () => {
  fireEvent.change(screen.getByLabelText('giftCodeOffer.form.name'), {
    target: { value: 'Ein Jahr schenken' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'pick plan' }));
  choosePeriodicity(PaymentPeriodicity.Yearly);
  choosePaymentMethod('Stripe');
};

const autoRenewCheckbox = () =>
  screen.getByRole('checkbox', { name: 'giftCodeOffer.form.autoRenew' });

const renewalMethodSelect = () =>
  screen.queryByRole('combobox', {
    name: 'giftCodeOffer.form.renewalPaymentMethod',
  });

const openRenewalMethods = () =>
  fireEvent.mouseDown(
    screen.getByRole('combobox', {
      name: 'giftCodeOffer.form.renewalPaymentMethod',
    })
  );

beforeEach(() => {
  planOverrides = {};
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

  it('puts active above every other sales setting', () => {
    renderView();

    const active = screen.getByRole('checkbox', {
      name: 'giftCodeOffer.form.active',
    });

    expect(
      active.compareDocumentPosition(
        screen.getByRole('button', { name: 'pick plan' })
      ) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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

  it('offers the durations the plan sells and has a price for', () => {
    renderView();

    fireEvent.click(screen.getByRole('button', { name: 'pick plan' }));
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'giftCodeOffer.form.periodicity' })
    );

    const options = within(screen.getByRole('listbox'))
      .getAllByRole('option')
      .map(option => option.textContent);

    expect(options).toEqual([
      'memberPlanList.paymentPeriodicity.monthly',
      'memberPlanList.paymentPeriodicity.yearly',
    ]);
  });

  it('offers what the plan sells, not what it has a price row for', () => {
    planOverrides = {
      periodicityPricing: [
        {
          periodicity: PaymentPeriodicity.Monthly,
          amountMin: 1000,
          amountTarget: null,
          amountMax: null,
        },
      ],
      availablePaymentMethods: [
        {
          paymentMethods: [{ id: 'method-3', name: 'Rechnung', active: true }],
          paymentPeriodicities: [PaymentPeriodicity.Yearly],
          forceAutoRenewal: true,
        },
      ],
    };
    renderView();

    fireEvent.click(screen.getByRole('button', { name: 'pick plan' }));
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'giftCodeOffer.form.periodicity' })
    );

    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual(['memberPlanList.paymentPeriodicity.yearly']);

    fireEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', {
        name: 'memberPlanList.paymentPeriodicity.yearly',
      })
    );

    expect(
      screen.getByText('giftCodeOffer.form.currentPrice:120.00 CHF')
    ).toBeInTheDocument();
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
          autoRenew: false,
          renewalPaymentMethodId: null,
        },
      })
    );
  });

  describe('automatic renewal', () => {
    it('sits below the other sales settings and does not renew by default', () => {
      renderView();

      expect(autoRenewCheckbox()).not.toBeChecked();
      expect(
        screen
          .getByRole('checkbox', {
            name: 'giftCodeOffer.form.allowDiscountCodes',
          })
          .compareDocumentPosition(autoRenewCheckbox()) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(renewalMethodSelect()).not.toBeInTheDocument();
    });

    it('offers the active payment methods of the plan for the chosen duration', () => {
      renderView();

      fillRequiredFields();
      fireEvent.click(autoRenewCheckbox());
      openRenewalMethods();

      const options = within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map(option => option.textContent);

      expect(options).toEqual(['Rechnung']);
    });

    it('creates an offer that renews with the chosen payment method', async () => {
      renderView();

      fillRequiredFields();
      fireEvent.click(autoRenewCheckbox());
      openRenewalMethods();
      fireEvent.click(
        within(screen.getByRole('listbox')).getByRole('option', {
          name: 'Rechnung',
        })
      );
      fireEvent.click(screen.getByTestId('saveButton'));

      await waitFor(() =>
        expect(createOffer).toHaveBeenCalledWith({
          variables: expect.objectContaining({
            autoRenew: true,
            renewalPaymentMethodId: 'method-3',
          }),
        })
      );
    });

    it('will not create a renewing offer without a payment method', async () => {
      renderView();

      fillRequiredFields();
      fireEvent.click(autoRenewCheckbox());
      fireEvent.click(screen.getByTestId('saveButton'));

      expect(
        await screen.findByText(
          'giftCodeOffer.form.renewalPaymentMethodRequired'
        )
      ).toBeInTheDocument();
      expect(createOffer).not.toHaveBeenCalled();
    });

    it('forgets the payment method once renewal is unticked', async () => {
      renderView();

      fillRequiredFields();
      fireEvent.click(autoRenewCheckbox());
      openRenewalMethods();
      fireEvent.click(
        within(screen.getByRole('listbox')).getByRole('option', {
          name: 'Rechnung',
        })
      );
      fireEvent.click(autoRenewCheckbox());
      fireEvent.click(screen.getByTestId('saveButton'));

      await waitFor(() =>
        expect(createOffer).toHaveBeenCalledWith({
          variables: expect.objectContaining({
            autoRenew: false,
            renewalPaymentMethodId: null,
          }),
        })
      );
      expect(renewalMethodSelect()).not.toBeInTheDocument();
    });

    it('forgets a payment method the new duration does not offer', async () => {
      renderView();

      fillRequiredFields();
      choosePeriodicity(PaymentPeriodicity.Monthly);
      fireEvent.click(autoRenewCheckbox());
      openRenewalMethods();
      fireEvent.click(
        within(screen.getByRole('listbox')).getByRole('option', {
          name: 'Twint',
        })
      );
      choosePeriodicity(PaymentPeriodicity.Yearly);
      fireEvent.click(screen.getByTestId('saveButton'));

      expect(
        await screen.findByText(
          'giftCodeOffer.form.renewalPaymentMethodRequired'
        )
      ).toBeInTheDocument();
      expect(createOffer).not.toHaveBeenCalled();
    });

    it('keeps a payment method the new duration still offers', async () => {
      renderView();

      fillRequiredFields();
      fireEvent.click(autoRenewCheckbox());
      openRenewalMethods();
      fireEvent.click(
        within(screen.getByRole('listbox')).getByRole('option', {
          name: 'Rechnung',
        })
      );
      choosePeriodicity(PaymentPeriodicity.Monthly);
      fireEvent.click(screen.getByTestId('saveButton'));

      await waitFor(() =>
        expect(createOffer).toHaveBeenCalledWith({
          variables: expect.objectContaining({
            periodicity: PaymentPeriodicity.Monthly,
            autoRenew: true,
            renewalPaymentMethodId: 'method-3',
          }),
        })
      );
    });

    it('cannot renew a plan that is not extendable', () => {
      planOverrides = { extendable: false };
      renderView();

      fireEvent.click(screen.getByRole('button', { name: 'pick plan' }));

      expect(autoRenewCheckbox()).toBeDisabled();
      expect(
        screen.getByText('giftCodeOffer.form.autoRenewNotExtendable')
      ).toBeInTheDocument();
    });
  });

  it('opens the new offer once it is created', () => {
    renderView();

    const { onCompleted } = mockedUseMutation.mock.calls.at(-1)![1];
    onCompleted({ createGiftCodeOffer: { id: 'offer-1' } });

    expect(navigate).toHaveBeenCalledWith('./../edit/offer-1');
  });
});
