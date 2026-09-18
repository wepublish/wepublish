import { Radio, css, lighten, useRadioGroup } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderMemberPlanItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef } from 'react';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { formatCurrency } from '../formatters/format-currency';
import {
  calculatePeriodAmount,
  getCheapestOffer,
  getMonthlyEquivalentRange,
  getPeriodicityLabel,
  getPeriodPriceRange,
  monthlyAmountFromPeriodAmount,
} from '../formatters/format-payment-period';
import { formatRenewalPeriod } from '../formatters/format-renewal-period';
import { CurrencyNumberSpinner } from '../payment-amount/payment-amount-picker/currency-number-spinner';
import {
  getLowestSelectableAmount,
  isFixedAmountLayout,
  offersAmountChoice,
  showsAmountInput,
} from '../subscribe/member-plan-render-settings';
import { useTranslation } from 'react-i18next';

export const MemberPlanItemWrapper = styled('div')<{ isUnavailable?: boolean }>`
  --memberplan-item-picker-checked-bg: ${({ theme }) =>
    lighten(theme.palette.primary.main, 0.85)};
  display: flex;
  flex-flow: column;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ isUnavailable }) =>
    isUnavailable &&
    css`
      opacity: 0.6;
    `}
`;

export const MemberPlanItemUnavailable = styled('div')`
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  color: ${({ theme }) => theme.palette.text.secondary};
`;

export const MemberPlanItemPicker = styled('div')<{ isChecked: boolean }>`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.grey[100]};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.palette.divider};

  ${({ theme, isChecked }) =>
    isChecked &&
    css`
      border-color: ${theme.palette.primary.main};
      background-color: var(--memberplan-item-picker-checked-bg);
    `}
`;

export const MemberPlanItemContent = styled('div')`
  display: grid;
`;

export const MemberPlanItemName = styled('span')`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

export const MemberPlanItemPrice = styled('small')`
  font-size: 0.75em;
`;

export const MemberPlanItemPeriodicity = styled('span')`
  font-size: 0.875em;
`;

export const MemberPlanItemLabel = styled('small')`
  justify-self: start;
  max-width: 100%;
  margin-top: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(1)}`};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
  font-size: 0.75em;
  line-height: 1.35;
  text-wrap: pretty;
`;

export const MemberPlanItemAmountSpinner = styled(CurrencyNumberSpinner)`
  grid-column: 1 / -1;
  justify-self: start;
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

export const MemberPlanItemDescription = styled('div')``;

export const MemberPlanItem = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanItemProps
>(
  (
    {
      className,
      id,
      name,
      slug,
      shortDescription,
      periodicityPricing,
      paymentPeriodicity,
      showPeriodicity,
      amountLayout,
      amount,
      onAmountChange,
      disabled,
      availablePaymentMethods,
      defaultPaymentPeriodicity,
      currency,
      extendable,
      ...props
    },
    ref
  ) => {
    const {
      blocks: { RichText },
      meta: { locale },
    } = useWebsiteBuilder();
    const radioGroup = useRadioGroup();
    const isChecked = props.checked ?? radioGroup?.value === id;
    const { t } = useTranslation();

    const memberPlan = {
      periodicityPricing,
      availablePaymentMethods,
      defaultPaymentPeriodicity,
    };

    const monthlyEquivalent = getMonthlyEquivalentRange(memberPlan);
    const amountPerMonthMin = monthlyEquivalent.amountPerMonthMin;

    const hasFixedAmount =
      monthlyEquivalent.amountPerMonthMax != null &&
      monthlyEquivalent.amountPerMonthMax ===
        monthlyEquivalent.amountPerMonthMin;

    const yearlyPriceRange = getPeriodPriceRange(
      memberPlan,
      PaymentPeriodicity.Yearly
    );
    const hasYearlyPricing = !!periodicityPricing?.some(
      price =>
        price.periodicity === PaymentPeriodicity.Yearly &&
        price.amountMin != null
    );
    const yearlyAmount =
      hasYearlyPricing ?
        yearlyPriceRange.amountMin / 100
      : Math.ceil((amountPerMonthMin / 100) * 12);

    const cheapestOffer =
      paymentPeriodicity ?
        {
          periodicity: paymentPeriodicity,
          ...getPeriodPriceRange(memberPlan, paymentPeriodicity),
        }
      : getCheapestOffer(memberPlan);
    const allowsHigherAmount = offersAmountChoice(
      amountLayout,
      cheapestOffer.periodicity
    );
    const periodicityLabel =
      paymentPeriodicity ?
        getPeriodicityLabel({ periodicityPricing }, paymentPeriodicity)
      : null;

    const showAmountSpinner =
      isFixedAmountLayout(amountLayout) && showsAmountInput(amountLayout);
    const planDefaultAmount =
      cheapestOffer.amountTarget ?? cheapestOffer.amountMin;
    const spinnerAmount =
      isChecked && amount != null ?
        calculatePeriodAmount(amount, cheapestOffer.periodicity)
      : planDefaultAmount;

    const advertisedAmount =
      showAmountSpinner ? spinnerAmount : (
        getLowestSelectableAmount(
          amountLayout,
          cheapestOffer.periodicity,
          cheapestOffer
        )
      );
    const cheapestOfferFixed =
      showAmountSpinner ||
      !allowsHigherAmount ||
      (cheapestOffer.amountMax != null &&
        cheapestOffer.amountMax === cheapestOffer.amountMin);

    return (
      <MemberPlanItemWrapper
        className={className}
        isUnavailable={disabled}
      >
        <MemberPlanItemPicker isChecked={isChecked}>
          <MemberPlanItemContent>
            <MemberPlanItemName>{name}</MemberPlanItemName>

            {showPeriodicity && paymentPeriodicity && (
              <MemberPlanItemPeriodicity>
                {formatRenewalPeriod(paymentPeriodicity)}
              </MemberPlanItemPeriodicity>
            )}

            <MemberPlanItemPrice>
              {t('subscribe.memberplan.price', {
                amountPerMonthMin,
                yearlyAmount,
                yearlyPrice: formatCurrency(yearlyAmount, currency, locale),
                monthlyPrice: formatCurrency(
                  amountPerMonthMin / 100,
                  currency,
                  locale
                ),
                extendable,
                exactAmount: hasFixedAmount,
                offerAmountMin: advertisedAmount,
                offerPrice: formatCurrency(
                  advertisedAmount / 100,
                  currency,
                  locale
                ),
                offerPeriodicity: cheapestOffer.periodicity,
                offerExactAmount: cheapestOfferFixed,
              })}
            </MemberPlanItemPrice>

            {periodicityLabel && (
              <MemberPlanItemLabel>{periodicityLabel}</MemberPlanItemLabel>
            )}

            {showAmountSpinner && (
              <MemberPlanItemAmountSpinner
                value={spinnerAmount / 100}
                min={cheapestOffer.amountMin / 100}
                step={1}
                helperText={t('subscribe.memberplan.amountMin', {
                  amount: formatCurrency(
                    cheapestOffer.amountMin / 100,
                    currency,
                    locale
                  ),
                })}
                onValueChange={spinnerValue => {
                  if (spinnerValue != null) {
                    onAmountChange?.(
                      monthlyAmountFromPeriodAmount(
                        Math.round(spinnerValue * 100),
                        cheapestOffer.periodicity
                      )
                    );
                  }
                }}
              />
            )}
          </MemberPlanItemContent>

          <Radio
            ref={ref}
            name={name}
            disableRipple={true}
            disabled={disabled}
            {...props}
          />
        </MemberPlanItemPicker>

        {disabled && (
          <MemberPlanItemUnavailable>
            {t('subscribe.memberplan.periodicityUnavailable')}
          </MemberPlanItemUnavailable>
        )}

        {shortDescription && (
          <MemberPlanItemDescription>
            <RichText richText={shortDescription} />
          </MemberPlanItemDescription>
        )}
      </MemberPlanItemWrapper>
    );
  }
);
