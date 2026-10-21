import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
  mockPeriodicityPrice,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { ComponentProps, useState } from 'react';
import { formatRenewalPeriod } from '../formatters/format-renewal-period';
import { MemberPlanOfferPicker } from './memberplan-offer-picker';

const monthlyAndYearly = mockAvailablePaymentMethod({
  paymentPeriodicities: [PaymentPeriodicity.Monthly, PaymentPeriodicity.Yearly],
});

const memberPlan = mockMemberPlan({
  name: 'Digital',
  availablePaymentMethods: [monthlyAndYearly],
  periodicityPricing: [
    mockPeriodicityPrice({
      periodicity: PaymentPeriodicity.Yearly,
      label: '2 Monate geschenkt',
      amountMin: 5000,
      amountTarget: 6000,
      amountMax: null,
    }),
  ],
});

const yearlyOnlyMemberPlan = mockMemberPlan({
  name: 'Print',
  availablePaymentMethods: [
    mockAvailablePaymentMethod({
      paymentPeriodicities: [PaymentPeriodicity.Yearly],
    }),
  ],
});

const defaultYearlyMemberPlan = mockMemberPlan({
  name: 'Gönner',
  defaultPaymentPeriodicity: PaymentPeriodicity.Yearly,
  availablePaymentMethods: [monthlyAndYearly],
});

type Props = ComponentProps<typeof MemberPlanOfferPicker>;

const ControlledMemberPlanOfferPicker = (props: Props) => {
  const [value, setValue] = useState(props.value);

  return (
    <MemberPlanOfferPicker
      {...props}
      value={value}
      onChange={offer => {
        props.onChange(offer);
        setValue(offer);
      }}
    />
  );
};

const renderOfferPicker = (props: Partial<Props> = {}) => {
  const onChange = vi.fn();

  renderWithProviders(
    <ControlledMemberPlanOfferPicker
      memberPlans={[memberPlan]}
      onChange={onChange}
      {...props}
    />
  );

  return { onChange, user: userEvent.setup() };
};

const offerRadio = (name: string, periodicity: PaymentPeriodicity) =>
  screen.getByLabelText(`${name} ${formatRenewalPeriod(periodicity)}`, {
    exact: false,
  });

describe('MemberPlanOfferPicker', () => {
  it('offers every periodicity of a plan as its own card with its marketing label', () => {
    renderOfferPicker();

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(
      offerRadio(memberPlan.name, PaymentPeriodicity.Monthly)
    ).toBeInTheDocument();
    expect(
      offerRadio(memberPlan.name, PaymentPeriodicity.Yearly)
    ).toBeInTheDocument();
    expect(screen.getByText('2 Monate geschenkt')).toBeInTheDocument();
  });

  it('selects the first offer of the first plan when nothing is selected', () => {
    const { onChange } = renderOfferPicker();

    expect(onChange).toHaveBeenCalledWith({
      memberPlanId: memberPlan.id,
      paymentPeriodicity: PaymentPeriodicity.Monthly,
    });
    expect(
      offerRadio(memberPlan.name, PaymentPeriodicity.Monthly)
    ).toBeChecked();
  });

  it('falls back to the default periodicity of the plan', () => {
    const { onChange } = renderOfferPicker({
      memberPlans: [defaultYearlyMemberPlan],
    });

    expect(onChange).toHaveBeenCalledWith({
      memberPlanId: defaultYearlyMemberPlan.id,
      paymentPeriodicity: PaymentPeriodicity.Yearly,
    });
  });

  it('reports plan and periodicity of the card the reader clicks', async () => {
    const { onChange, user } = renderOfferPicker();

    await user.click(offerRadio(memberPlan.name, PaymentPeriodicity.Yearly));

    expect(onChange).toHaveBeenLastCalledWith({
      memberPlanId: memberPlan.id,
      paymentPeriodicity: PaymentPeriodicity.Yearly,
    });
    expect(
      offerRadio(memberPlan.name, PaymentPeriodicity.Yearly)
    ).toBeChecked();
  });

  it('shows a plan with a single periodicity as one card without the periodicity', () => {
    renderOfferPicker({ memberPlans: [memberPlan, yearlyOnlyMemberPlan] });

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(
      offerRadio(yearlyOnlyMemberPlan.name, PaymentPeriodicity.Yearly)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(formatRenewalPeriod(PaymentPeriodicity.Yearly))
    ).toHaveLength(1);
  });

  it('keeps a preselected offer without reporting a change', () => {
    const { onChange } = renderOfferPicker({
      value: {
        memberPlanId: memberPlan.id,
        paymentPeriodicity: PaymentPeriodicity.Yearly,
      },
    });

    expect(
      offerRadio(memberPlan.name, PaymentPeriodicity.Yearly)
    ).toBeChecked();
    expect(
      offerRadio(memberPlan.name, PaymentPeriodicity.Monthly)
    ).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders nothing without plans', () => {
    const { onChange } = renderOfferPicker({ memberPlans: [] });

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the description of the selected plan below the offers', async () => {
    const yearlyPlan = mockMemberPlan({
      name: 'Jahresabo',
      image: null,
      description: mockRichTextParagraph('Vier Ausgaben pro Jahr'),
      availablePaymentMethods: [
        mockAvailablePaymentMethod({
          paymentPeriodicities: [PaymentPeriodicity.Yearly],
        }),
      ],
    });
    const lifetimePlan = mockMemberPlan({
      name: 'Lebenszeit-Abo',
      image: null,
      description: mockRichTextParagraph('Ein Leben lang'),
      availablePaymentMethods: [
        mockAvailablePaymentMethod({
          paymentPeriodicities: [PaymentPeriodicity.Lifetime],
        }),
      ],
    });

    const { user } = renderOfferPicker({
      memberPlans: [yearlyPlan, lifetimePlan],
    });

    expect(screen.getByText('Vier Ausgaben pro Jahr')).toBeInTheDocument();
    expect(screen.queryByText('Ein Leben lang')).not.toBeInTheDocument();

    await user.click(
      offerRadio(lifetimePlan.name, PaymentPeriodicity.Lifetime)
    );

    expect(screen.getByText('Ein Leben lang')).toBeInTheDocument();
    expect(
      screen.queryByText('Vier Ausgaben pro Jahr')
    ).not.toBeInTheDocument();
  });
});
