import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockAvailablePaymentMethod,
  mockImage,
  mockMemberPlan,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  Currency,
  FullMemberPlanFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { ComponentProps, useState } from 'react';
import { MemberPlanPicker } from './memberplan-picker';

const memberPlans = [
  mockMemberPlan({
    name: 'Basic',
    image: mockImage({ description: 'Basic plan perks' }),
  }),
  mockMemberPlan({ name: 'Plus', currency: Currency.Eur }),
  mockMemberPlan({ name: 'Once', extendable: false }),
];

type Props = ComponentProps<typeof MemberPlanPicker>;

const ControlledMemberPlanPicker = (props: Props) => {
  const [value, setValue] = useState(props.value);

  return (
    <MemberPlanPicker
      {...props}
      value={value}
      onChange={memberPlanId => {
        props.onChange(memberPlanId);
        setValue(memberPlanId);
      }}
    />
  );
};

const renderMemberPlanPicker = (props: Partial<Props> = {}) => {
  const onChange = vi.fn();

  renderWithProviders(
    <ControlledMemberPlanPicker
      memberPlans={memberPlans}
      onChange={onChange}
      {...props}
    />
  );

  return { onChange, user: userEvent.setup() };
};

const planRadio = (plan: FullMemberPlanFragment) =>
  screen.getByLabelText(plan.name, { exact: false });

describe('MemberPlanPicker', () => {
  it('selects the first plan when nothing is selected', () => {
    const { onChange } = renderMemberPlanPicker();

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(onChange).toHaveBeenCalledWith(memberPlans[0].id);
    expect(planRadio(memberPlans[0])).toBeChecked();
  });

  it('switches to the plan the reader clicks', async () => {
    const { onChange, user } = renderMemberPlanPicker();

    await user.click(planRadio(memberPlans[2]));

    expect(onChange).toHaveBeenLastCalledWith(memberPlans[2].id);
    expect(planRadio(memberPlans[2])).toBeChecked();
    expect(planRadio(memberPlans[0])).not.toBeChecked();
  });

  it('keeps the given plan selected without reporting a change', () => {
    const { onChange } = renderMemberPlanPicker({ value: memberPlans[1].id });

    expect(planRadio(memberPlans[1])).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows a single plan without a choice but with its image', () => {
    const { onChange } = renderMemberPlanPicker({
      memberPlans: [memberPlans[0]],
    });

    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(onChange).toHaveBeenCalledWith(memberPlans[0].id);
    expect(
      screen.getByRole('img', { name: 'Basic plan perks' })
    ).toBeInTheDocument();
  });

  it('renders nothing for a single plan without image or description', () => {
    const plan = mockMemberPlan({
      image: null,
      description: null,
    });

    renderMemberPlanPicker({ memberPlans: [plan] });

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('disables plans that do not offer the required periodicity and selects the first one that does', () => {
    const yearlyOnly = mockMemberPlan({
      name: 'Yearly only',
      availablePaymentMethods: [
        mockAvailablePaymentMethod({
          paymentPeriodicities: [PaymentPeriodicity.Yearly],
        }),
      ],
    });
    const monthly = mockMemberPlan({
      name: 'Monthly',
      availablePaymentMethods: [
        mockAvailablePaymentMethod({
          paymentPeriodicities: [PaymentPeriodicity.Monthly],
        }),
      ],
    });

    const { onChange } = renderMemberPlanPicker({
      memberPlans: [yearlyOnly, monthly],
      requiredPeriodicity: PaymentPeriodicity.Monthly,
    });

    expect(planRadio(yearlyOnly)).toBeDisabled();
    expect(planRadio(monthly)).toBeEnabled();
    expect(
      screen.getByText(t('subscribe.memberplan.periodicityUnavailable'))
    ).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(monthly.id);
  });
});
