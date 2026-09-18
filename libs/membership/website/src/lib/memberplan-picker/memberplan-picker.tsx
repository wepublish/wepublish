import { FormControlLabel, RadioGroup } from '@mui/material';
import styled from '@emotion/styled';
import { toPlaintext } from '@wepublish/richtext';
import {
  BuilderMemberPlanPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef, useCallback, useEffect } from 'react';
import { getPlanPeriodicities } from '../formatters/format-payment-period';
import { findMemberPlanRenderSetting } from '../subscribe/member-plan-render-settings';

export const MemberPlanPickerWrapper = styled('fieldset')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  // reset fieldset values
  margin: unset;
  padding: unset;
  border: unset;
`;

export const MemberPlanPickerRadios = styled(RadioGroup)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};

  // hide unwanted label
  label {
    margin: 0;
    display: grid;
    align-items: stretch;

    & > span {
      display: none;
    }
  }
`;

export const MemberPlanPicker = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanPickerProps & { alwaysShow?: boolean }
>(function MemberPlanPicker(
  {
    memberPlans,
    onChange,
    value,
    className,
    name,
    alwaysShow,
    paymentPeriodicity,
    memberPlanRenderSettings,
    amount,
    onAmountChange,
  },
  ref
) {
  const {
    MemberPlanItem,
    elements: { Image },
    blocks: { RichText },
  } = useWebsiteBuilder();

  const showRadioButtons = memberPlans.length > 1 || alwaysShow;
  const selectedMemberPlan = memberPlans.find(({ id }) => id === value);
  const showPicker =
    showRadioButtons ||
    toPlaintext(selectedMemberPlan?.description?.content) ||
    selectedMemberPlan?.image;

  const isUnavailable = useCallback(
    (memberPlan: (typeof memberPlans)[number]) =>
      !!paymentPeriodicity &&
      !getPlanPeriodicities(memberPlan).includes(paymentPeriodicity),
    [paymentPeriodicity]
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

  if (!showPicker) {
    return;
  }

  return (
    <MemberPlanPickerWrapper className={className}>
      {showRadioButtons && (
        <MemberPlanPickerRadios
          name={name}
          onChange={event => onChange(event.target.value)}
          value={value ? value : ''}
          ref={ref}
        >
          {memberPlans.map(memberPlan => (
            <FormControlLabel
              key={memberPlan.id}
              value={memberPlan.id}
              disabled={isUnavailable(memberPlan)}
              control={
                <MemberPlanItem
                  slug={memberPlan.slug}
                  key={memberPlan.id}
                  checked={memberPlan.id === value}
                  paymentPeriodicity={paymentPeriodicity}
                  amountLayout={
                    findMemberPlanRenderSetting(
                      memberPlanRenderSettings,
                      memberPlan.id
                    )?.layout
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
                  defaultPaymentPeriodicity={
                    memberPlan.defaultPaymentPeriodicity
                  }
                  extendable={memberPlan.extendable}
                  shortDescription={memberPlan.shortDescription}
                  tags={memberPlan.tags}
                  goodies={memberPlan.goodies}
                />
              }
              label={memberPlan.name}
            />
          ))}
        </MemberPlanPickerRadios>
      )}
      {selectedMemberPlan?.image && <Image image={selectedMemberPlan.image} />}

      {!!selectedMemberPlan?.description?.content?.length && (
        <RichText richText={selectedMemberPlan.description} />
      )}
    </MemberPlanPickerWrapper>
  );
});
