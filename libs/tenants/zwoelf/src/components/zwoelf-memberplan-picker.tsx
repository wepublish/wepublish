import styled from '@emotion/styled';
import { FormControlLabel } from '@mui/material';
import {
  findMemberPlanRenderSetting,
  getPlanPeriodicities,
  MemberPlanItemAmountSpinner,
  MemberPlanItemContent,
  MemberPlanItemPicker,
  MemberPlanPickerRadios,
} from '@wepublish/membership/website';
import { FullMemberPlanFragment } from '@wepublish/website/api';
import {
  BuilderMemberPlanPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { partition } from 'ramda';
import { useCallback, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';

/** Member plans carrying this tag are grouped as "Supporter-Abos". */
export const ZWOELF_SUPPORTER_TAG = 'supporter';

const PlanGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SupporterGroup = styled('fieldset')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  margin: 0;
  padding: ${({ theme }) => theme.spacing(3)};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.palette.grey[50]};
`;

const SupporterTitle = styled('legend')`
  float: left;
  width: 100%;
  padding: 0;
  font-weight: ${({ theme }) => theme.typography.fontWeightBold};
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
`;

const SupporterDescription = styled('p')`
  margin: 0;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const StyledRadios = styled(MemberPlanPickerRadios)`
  grid-template-columns: 1fr;

  /*
   * Keep the radio next to name and price: the amount spinner of an open
   * amount plan gets its own full-width row below instead of pushing the
   * radio down to its middle.
   */
  ${MemberPlanItemPicker} {
    align-items: center;
  }

  ${MemberPlanItemContent} {
    display: contents;
  }

  ${MemberPlanItemContent} > * {
    grid-column: 1;
  }

  ${MemberPlanItemPicker} > .MuiRadio-root {
    grid-column: 2;
    grid-row: 1 / span 2;
  }

  ${MemberPlanItemContent} > ${MemberPlanItemAmountSpinner} {
    grid-column: 1 / -1;

    input {
      margin: 0;
      text-align: center;
    }
  }
`;

/**
 * The "Abo wählen" step: the basic plans first, then the supporter plans
 * (tag `supporter`) in a box with their own title and description.
 */
export const ZwoelfMemberPlanPicker = ({
  memberPlans,
  onChange,
  value,
  className,
  name,
  paymentPeriodicity,
  requiredPeriodicity,
  memberPlanRenderSettings,
  amount,
  onAmountChange,
}: BuilderMemberPlanPickerProps) => {
  const { t } = useTranslation();
  const { MemberPlanItem } = useWebsiteBuilder();
  const titleId = useId();

  const selectedMemberPlan = memberPlans.find(({ id }) => id === value);

  const isUnavailable = useCallback(
    (memberPlan: FullMemberPlanFragment) =>
      !!requiredPeriodicity &&
      !getPlanPeriodicities(memberPlan).includes(requiredPeriodicity),
    [requiredPeriodicity]
  );

  useEffect(() => {
    if (!memberPlans.length || selectedMemberPlan) {
      return;
    }

    const available = memberPlans.find(
      memberPlan => !isUnavailable(memberPlan)
    );

    onChange((available ?? memberPlans[0]).id);
  }, [memberPlans, onChange, selectedMemberPlan, isUnavailable]);

  const [supporterPlans, basicPlans] = partition(
    memberPlan => memberPlan.tags?.includes(ZWOELF_SUPPORTER_TAG) ?? false,
    memberPlans
  );

  const renderPlan = (memberPlan: FullMemberPlanFragment) => (
    <FormControlLabel
      key={memberPlan.id}
      value={memberPlan.id}
      disabled={isUnavailable(memberPlan)}
      control={
        <MemberPlanItem
          slug={memberPlan.slug}
          checked={memberPlan.id === value}
          paymentPeriodicity={paymentPeriodicity}
          amountLayout={
            findMemberPlanRenderSetting(memberPlanRenderSettings, memberPlan.id)
              ?.layout
          }
          amount={amount}
          onAmountChange={monthlyAmount => {
            onChange(memberPlan.id);
            onAmountChange?.(monthlyAmount);
          }}
          disabled={isUnavailable(memberPlan)}
          name={memberPlan.name}
          currency={memberPlan.currency}
          periodicityPricing={memberPlan.periodicityPricing}
          availablePaymentMethods={memberPlan.availablePaymentMethods}
          defaultPaymentPeriodicity={memberPlan.defaultPaymentPeriodicity}
          extendable={memberPlan.extendable}
          shortDescription={memberPlan.shortDescription}
          tags={memberPlan.tags}
          goodies={memberPlan.goodies}
        />
      }
      label={memberPlan.name}
    />
  );

  return (
    <StyledRadios
      className={className}
      name={name}
      onChange={event => onChange(event.target.value)}
      value={value ?? ''}
    >
      {!!basicPlans.length && <PlanGrid>{basicPlans.map(renderPlan)}</PlanGrid>}

      {!!supporterPlans.length && (
        <SupporterGroup aria-labelledby={titleId}>
          <SupporterTitle id={titleId}>
            {t('zwoelf.subscribe.supporter.title')}
          </SupporterTitle>

          <SupporterDescription>
            {t('zwoelf.subscribe.supporter.description')}
          </SupporterDescription>

          <PlanGrid>{supporterPlans.map(renderPlan)}</PlanGrid>
        </SupporterGroup>
      )}
    </StyledRadios>
  );
};
