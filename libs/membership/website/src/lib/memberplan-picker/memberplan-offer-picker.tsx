import {
  FormControlLabel,
  Radio,
  RadioGroup,
  css,
  lighten,
} from '@mui/material';
import styled from '@emotion/styled';
import { PaymentPeriodicity } from '@wepublish/website/api';
import {
  BuilderMemberPlanOfferPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../formatters/format-currency';
import {
  getDefaultPeriodicity,
  getPeriodicityLabel,
  getPeriodPriceRange,
  getPlanPeriodicities,
} from '../formatters/format-payment-period';
import { formatRenewalPeriod } from '../formatters/format-renewal-period';

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

  label {
    margin: 0;
    display: grid;
    align-items: stretch;

    & > span:last-of-type {
      display: none;
    }
  }
`;

export const MemberPlanOfferWrapper = styled('div')<{ isChecked: boolean }>`
  --memberplan-offer-picker-checked-bg: ${({ theme }) =>
    lighten(theme.palette.primary.main, 0.85)};
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: min-content;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(1)};
  height: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.grey[100]};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.palette.divider};

  ${({ theme, isChecked }) =>
    isChecked &&
    css`
      border-color: ${theme.palette.primary.main};
      background-color: var(--memberplan-offer-picker-checked-bg);
    `}
`;

export const MemberPlanOfferContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  align-content: start;
`;

export const MemberPlanOfferName = styled('span')`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

export const MemberPlanOfferPeriodicity = styled('span')`
  font-size: 0.875em;
`;

export const MemberPlanOfferPrice = styled('strong')`
  font-size: 1.125em;
`;

export const MemberPlanOfferLabel = styled('small')`
  justify-self: start;
  padding: ${({ theme }) => `${theme.spacing(0.25)} ${theme.spacing(1)}`};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
`;

export const MemberPlanOfferDescription = styled('div')`
  grid-column: 1 / -1;
  font-size: 0.875em;
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
  { memberPlans, onChange, value, className, name },
  ref
) {
  const {
    meta: { locale },
    blocks: { RichText },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

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
        {offers.map(offer => {
          const { memberPlan, paymentPeriodicity, showPeriodicity } = offer;
          const priceRange = getPeriodPriceRange(
            memberPlan,
            paymentPeriodicity
          );
          const label = getPeriodicityLabel(memberPlan, paymentPeriodicity);
          const hasFixedAmount =
            priceRange.amountMax != null &&
            priceRange.amountMax === priceRange.amountMin;
          const isChecked = offer.key === selectedKey;

          return (
            <FormControlLabel
              key={offer.key}
              value={offer.key}
              control={
                <Radio
                  ref={isChecked ? ref : undefined}
                  disableRipple
                  checked={isChecked}
                  inputProps={{
                    'aria-label': `${memberPlan.name} ${formatRenewalPeriod(paymentPeriodicity)}`,
                  }}
                />
              }
              label={
                <MemberPlanOfferWrapper isChecked={isChecked}>
                  <MemberPlanOfferContent>
                    <MemberPlanOfferName>{memberPlan.name}</MemberPlanOfferName>

                    {showPeriodicity && (
                      <MemberPlanOfferPeriodicity>
                        {formatRenewalPeriod(paymentPeriodicity)}
                      </MemberPlanOfferPeriodicity>
                    )}

                    <MemberPlanOfferPrice>
                      {t('subscribe.memberplan.offerPrice', {
                        amountMin: priceRange.amountMin,
                        exactAmount: hasFixedAmount,
                        periodPrice: formatCurrency(
                          priceRange.amountMin / 100,
                          memberPlan.currency,
                          locale
                        ),
                        periodicity: paymentPeriodicity,
                      })}
                    </MemberPlanOfferPrice>
                  </MemberPlanOfferContent>

                  {label && (
                    <MemberPlanOfferLabel>{label}</MemberPlanOfferLabel>
                  )}

                  {memberPlan.shortDescription && (
                    <MemberPlanOfferDescription>
                      <RichText richText={memberPlan.shortDescription} />
                    </MemberPlanOfferDescription>
                  )}
                </MemberPlanOfferWrapper>
              }
            />
          );
        })}
      </MemberPlanOfferPickerRadios>
    </MemberPlanOfferPickerWrapper>
  );
});
