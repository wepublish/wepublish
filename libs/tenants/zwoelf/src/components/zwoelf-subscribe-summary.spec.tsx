import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  applyTenantTranslations,
  mockMemberPlan,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { formatCurrency } from '@wepublish/membership/website';
import { Currency, PaymentPeriodicity } from '@wepublish/website/api';
import { BuilderSubscribeSummaryProps } from '@wepublish/website/builder';

import { zwoelfTenant } from '../zwoelf-tenant';
import {
  ZwoelfSubscribeStep,
  ZwoelfSubscribeStepContext,
} from './zwoelf-subscribe-step-context';
import { ZwoelfSubscribeSummary } from './zwoelf-subscribe-summary';

const fankurve = mockMemberPlan({ name: '#12 - Fankurve' });

const renderSummary = (
  step: ZwoelfSubscribeStep,
  props: Partial<BuilderSubscribeSummaryProps> = {}
) => {
  const setStep = vi.fn();
  const validateSelection = vi.fn().mockResolvedValue(true);

  renderWithProviders(
    <ZwoelfSubscribeStepContext
      value={{ step, setStep, mode: 'self', setMode: vi.fn() }}
    >
      <ZwoelfSubscribeSummary
        memberPlan={fankurve}
        paymentPeriodicity={PaymentPeriodicity.Yearly}
        monthlyAmount={992}
        periodAmount={11900}
        currency={Currency.Chf}
        selectedPlanUnavailable={false}
        validateSelection={validateSelection}
        {...props}
      />
    </ZwoelfSubscribeStepContext>,
    { tenant: zwoelfTenant }
  );

  return { setStep, validateSelection, user: userEvent.setup() };
};

const summaryText = `Gewählt: Für mich · 1 Jahr · #12 - Fankurve · ${formatCurrency(119, Currency.Chf)}`;

describe('ZwoelfSubscribeSummary', () => {
  beforeAll(() => applyTenantTranslations(zwoelfTenant));
  afterAll(() => resetTranslations());

  it('sums up the choice and continues once it is valid', async () => {
    const { setStep, validateSelection, user } = renderSummary(1);

    expect(screen.getByText(/Gewählt:/)).toHaveTextContent(summaryText);

    await user.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(validateSelection).toHaveBeenCalled();
    await waitFor(() => expect(setStep).toHaveBeenCalledWith(2));
  });

  it('stays on the choice while it is invalid', async () => {
    const { setStep, user } = renderSummary(1, {
      validateSelection: vi.fn().mockResolvedValue(false),
    });

    await user.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(setStep).not.toHaveBeenCalled();
  });

  it('does not continue while the plan is unavailable for the duration', () => {
    renderSummary(1, { selectedPlanUnavailable: true });

    expect(screen.getByRole('button', { name: 'Weiter' })).toBeDisabled();
  });

  it('offers to go back to the choice on the second step', async () => {
    const { setStep, user } = renderSummary(2);

    expect(screen.getByText(/Gewählt:/)).toHaveTextContent(summaryText);
    expect(
      screen.queryByRole('button', { name: 'Weiter' })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Zurück zur Auswahl' })
    );

    expect(setStep).toHaveBeenCalledWith(1);
  });
});
