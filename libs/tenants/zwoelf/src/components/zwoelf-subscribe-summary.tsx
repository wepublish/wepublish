import styled from '@emotion/styled';
import {
  formatCurrency,
  formatRenewalPeriod,
} from '@wepublish/membership/website';
import {
  BuilderSubscribeSummaryProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';

import { useZwoelfSubscribeStep } from './zwoelf-subscribe-step-context';

const SummaryBar = styled('div')`
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2, 0)};
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  background-color: ${({ theme }) => theme.palette.background.default};
`;

const SummaryHeader = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
`;

/**
 * "Gewählt: Für mich · 1 Jahr · #12 - Fankurve · CHF 119.–". On the first
 * step it is the sticky bar with the "Weiter" button, on the second step the
 * header with the way back to the choice.
 */
export const ZwoelfSubscribeSummary = ({
  memberPlan,
  paymentPeriodicity,
  periodAmount,
  currency,
  selectedPlanUnavailable,
  validateSelection,
  className,
}: BuilderSubscribeSummaryProps) => {
  const { t } = useTranslation();
  const {
    meta: { locale },
    elements: { Button },
  } = useWebsiteBuilder();
  const { step, setStep, mode } = useZwoelfSubscribeStep();

  const choice = [
    t(`zwoelf.subscribe.mode.${mode}`),
    t(`zwoelf.subscribe.periodicity.${paymentPeriodicity}`, {
      defaultValue: formatRenewalPeriod(paymentPeriodicity),
    }),
    memberPlan?.name,
    formatCurrency(periodAmount / 100, currency, locale),
  ]
    .filter(Boolean)
    .join(' · ');

  const summary = (
    <span>
      {t('zwoelf.subscribe.summary.chosen')} <strong>{choice}</strong>
    </span>
  );

  if (step === 2) {
    return (
      <SummaryHeader className={className}>
        {summary}

        <Button
          variant="text"
          onClick={() => setStep(1)}
        >
          {t('zwoelf.subscribe.summary.back')}
        </Button>
      </SummaryHeader>
    );
  }

  return (
    <SummaryBar className={className}>
      {summary}

      <Button
        variant="contained"
        size="large"
        disabled={selectedPlanUnavailable}
        onClick={async () => {
          if (await validateSelection()) {
            setStep(2);
          }
        }}
      >
        {t('zwoelf.subscribe.summary.next')}
      </Button>
    </SummaryBar>
  );
};
