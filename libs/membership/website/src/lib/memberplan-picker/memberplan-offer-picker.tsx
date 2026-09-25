import { FormControlLabel, RadioGroup } from '@mui/material';
import styled from '@emotion/styled';
import { PaymentPeriodicity } from '@wepublish/website/api';
import {
  BuilderMemberPlanOfferPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef, useEffect, useMemo } from 'react';
import {
  getDefaultPeriodicity,
  getPlanPeriodicities,
} from '../formatters/format-payment-period';
import { formatRenewalPeriod } from '../formatters/format-renewal-period';
import { findMemberPlanRenderSetting } from '../subscribe/member-plan-render-settings';

export const MemberPlanOfferPickerWrapper = styled('fieldset')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  margin: unset;
  padding: unset;
  border: unset;
`;

export const MemberPlanOfferPickerRadios = styled(RadioGroup)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: stretch;

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

type MemberPlanOfferEntry = {
  key: string;
  memberPlan: BuilderMemberPlanOfferPickerProps['memberPlans'][number];
  paymentPeriodicity: PaymentPeriodicity;
  showPeriodicity: boolean;
};

export const getMemberPlanOffers = (
  memberPlans: BuilderMemberPlanOfferPickerProps['memberPlans']
): MemberPlanOfferEntry[] =>
  memberPlans.flatMap(memberPlan => {
    const periodicities = getPlanPeriodicities(memberPlan);

    if (!periodicities.length) {
      return [
        {
          key: `${memberPlan.id}:${PaymentPeriodicity.Monthly}`,
          memberPlan,
          paymentPeriodicity: PaymentPeriodicity.Monthly,
          showPeriodicity: false,
        },
      ];
    }

    return periodicities.map(paymentPeriodicity => ({
      key: `${memberPlan.id}:${paymentPeriodicity}`,
      memberPlan,
      paymentPeriodicity,
      showPeriodicity: periodicities.length > 1,
    }));
  });

export const MemberPlanOfferPicker = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanOfferPickerProps
>(function MemberPlanOfferPicker(
  {
    memberPlans,
    onChange,
    value,
    className,
    name,
    memberPlanRenderSettings,
    amount,
    onAmountChange,
  },
  ref
) {
  const { MemberPlanItem } = useWebsiteBuilder();
  const offers = useMemo(() => getMemberPlanOffers(memberPlans), [memberPlans]);

  const selectedKey =
    value?.memberPlanId && value?.paymentPeriodicity ?
      `${value.memberPlanId}:${value.paymentPeriodicity}`
    : '';
  const selectedOffer = offers.find(offer => offer.key === selectedKey);

  useEffect(() => {
    if (offers.length && !selectedOffer) {
      const fallbackPlan =
        offers.find(offer => offer.memberPlan.id === value?.memberPlanId)
          ?.memberPlan ?? offers[0].memberPlan;

      onChange({
        memberPlanId: fallbackPlan.id,
        paymentPeriodicity:
          getDefaultPeriodicity(fallbackPlan) ?? offers[0].paymentPeriodicity,
      });
    }
  }, [offers, onChange, selectedOffer, value?.memberPlanId]);

  if (!offers.length) {
    return null;
  }

  return (
    <MemberPlanOfferPickerWrapper className={className}>
      <MemberPlanOfferPickerRadios
        ref={ref}
        name={name}
        value={selectedKey}
        onChange={event => {
          const offer = offers.find(({ key }) => key === event.target.value);

          if (offer) {
            onChange({
              memberPlanId: offer.memberPlan.id,
              paymentPeriodicity: offer.paymentPeriodicity,
            });
          }
        }}
      >
        {offers.map(offer => (
          <FormControlLabel
            key={offer.key}
            value={offer.key}
            control={
              <MemberPlanItem
                checked={offer.key === selectedKey}
                name={offer.memberPlan.name}
                slug={offer.memberPlan.slug}
                currency={offer.memberPlan.currency}
                extendable={offer.memberPlan.extendable}
                shortDescription={offer.memberPlan.shortDescription}
                tags={offer.memberPlan.tags}
                goodies={offer.memberPlan.goodies}
                periodicityPricing={offer.memberPlan.periodicityPricing}
                availablePaymentMethods={
                  offer.memberPlan.availablePaymentMethods
                }
                defaultPaymentPeriodicity={
                  offer.memberPlan.defaultPaymentPeriodicity
                }
                paymentPeriodicity={offer.paymentPeriodicity}
                showPeriodicity={offer.showPeriodicity}
                amountLayout={
                  findMemberPlanRenderSetting(
                    memberPlanRenderSettings,
                    offer.memberPlan.id
                  )?.layout
                }
                amount={amount}
                onAmountChange={monthlyAmount => {
                  onChange({
                    memberPlanId: offer.memberPlan.id,
                    paymentPeriodicity: offer.paymentPeriodicity,
                  });
                  onAmountChange?.(monthlyAmount);
                }}
              />
            }
            label={`${offer.memberPlan.name} ${formatRenewalPeriod(offer.paymentPeriodicity)}`}
          />
        ))}
      </MemberPlanOfferPickerRadios>
    </MemberPlanOfferPickerWrapper>
  );
});
