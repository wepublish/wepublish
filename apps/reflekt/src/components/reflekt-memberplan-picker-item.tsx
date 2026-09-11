import styled from '@emotion/styled';
import { Radio, useRadioGroup } from '@mui/material';
import {
  calculatePeriodAmount,
  CurrencyNumberSpinner,
  formatCurrency,
  getPeriodPriceRange,
  MemberPlanItemContent,
  MemberPlanItemName,
  MemberPlanItemPicker,
  MemberPlanItemPrice,
  MemberPlanItemWrapper,
} from '@wepublish/membership/website';
import { PaymentPeriodicity } from '@wepublish/website/api';
import {
  BuilderMemberPlanItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { euclidCircularB, robotoMono } from '../theme';

export const MemberPlanItemFreeInputSpinner = styled(CurrencyNumberSpinner)`
  grid-column: 1 / -1;
  justify-self: start;
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

export const MemberPlanItemAmountError = styled('small')`
  grid-column: 1 / -1;
  font-size: 0.75em;
  color: ${({ theme }) => theme.palette.error.main};
`;

export const MemberPlanItem = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanItemProps
>(function MemberPlanItem(
  {
    className,
    id,
    name,
    slug,
    shortDescription,
    amountPerMonthMax,
    amountPerMonthMin,
    amountPerMonthTarget,
    periodicityPricing,
    currency,
    extendable,
    goodies,
    tags,
    ...props
  },
  ref
) {
  const {
    meta: { locale },
  } = useWebsiteBuilder();
  const radioGroup = useRadioGroup();
  const isChecked = props.checked ?? radioGroup?.value === id;
  const { t } = useTranslation();
  const form = useFormContext();
  const control = form?.control;
  const errors = form?.formState.errors;
  const setValue = form?.setValue;

  const monthlyAmount = useWatch({
    control,
    name: 'monthlyAmount',
    disabled: !isChecked,
  }) as number;

  const hasFixedAmount =
    amountPerMonthMax != null && amountPerMonthMax === amountPerMonthMin;

  const hasInCardFreeInput = tags?.includes('inline-slider');

  const memberPlan = {
    amountPerMonthMin,
    amountPerMonthTarget,
    amountPerMonthMax,
    periodicityPricing,
  };

  const yearlyPriceRange = getPeriodPriceRange(
    memberPlan,
    PaymentPeriodicity.Yearly
  );
  const yearlyCents =
    isChecked && monthlyAmount != null ?
      calculatePeriodAmount(monthlyAmount, PaymentPeriodicity.Yearly)
    : yearlyPriceRange.amountMin;

  return (
    <MemberPlanItemWrapper className={className}>
      <MemberPlanItemPicker isChecked={isChecked}>
        <MemberPlanItemContent>
          <MemberPlanItemName>{name}</MemberPlanItemName>

          <MemberPlanItemPrice>
            {t('subscribe.memberplan.price', {
              yearlyAmount: Math.round(yearlyCents / 100),
              amountPerMonthMin,
              yearlyPrice: formatCurrency(yearlyCents / 100, currency, locale),
              monthlyPrice: formatCurrency(
                amountPerMonthMin / 100,
                currency,
                locale
              ),
              extendable,
              exactAmount: hasFixedAmount,
            })}
          </MemberPlanItemPrice>
        </MemberPlanItemContent>

        <Radio
          ref={ref}
          name={name}
          disableRipple={true}
          {...props}
        />

        {hasInCardFreeInput && isChecked && (
          <MemberPlanItemFreeInputSpinner
            arrows="stacked"
            min={amountPerMonthMin / 100}
            step={1}
            value={(monthlyAmount ?? amountPerMonthMin) / 100}
            onValueChange={spinnerValue => {
              if (spinnerValue != null) {
                setValue?.('monthlyAmount', Math.round(spinnerValue * 100));
              }
            }}
            helperText={`Min ${formatCurrency(amountPerMonthMin / 100, currency, locale)}`}
          />
        )}

        {hasInCardFreeInput && isChecked && errors?.monthlyAmount && (
          <MemberPlanItemAmountError>
            {errors.monthlyAmount.message?.toString()}
          </MemberPlanItemAmountError>
        )}
      </MemberPlanItemPicker>
    </MemberPlanItemWrapper>
  );
});

export const ReflektMemberPlanItem = styled(MemberPlanItem)`
  container-type: inline-size;

  ${MemberPlanItemPicker} {
    aspect-ratio: 1 / 1;
    display: grid;
    grid-template-columns: 1fr;
    align-items: stretch;
    width: 100%;
    height: auto;
    padding: ${({ theme }) => theme.spacing(2)};
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
    border: none;
    border-radius: 0;
    position: relative;
    overflow: hidden;

    &:has(.Mui-checked) {
      background-color: ${({ theme }) => theme.palette.common.white};
      color: ${({ theme }) => theme.palette.common.black};
    }

    .MuiRadio-root {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      opacity: 0;
      cursor: pointer;
    }
  }

  ${MemberPlanItemContent} {
    display: grid;
    grid-template-rows: 1fr 1fr;
    height: 100%;
    text-align: center;
  }

  ${MemberPlanItemPrice} {
    grid-row: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${[euclidCircularB.style.fontFamily, 'sans-serif'].join(',')};
    font-weight: 500;
    font-size: clamp(3.25rem, 42cqi, 8.5rem);
    line-height: 1;
  }

  ${MemberPlanItemFreeInputSpinner} {
    position: relative;
    z-index: 1;
    justify-self: center;
  }

  ${MemberPlanItemName} {
    grid-row: 2;
    display: grid;
    align-content: space-between;
    justify-items: center;
    padding-block: ${({ theme }) => theme.spacing(1, 2)};
    font-family: ${[euclidCircularB.style.fontFamily, 'sans-serif'].join(',')};
    font-weight: 500;
    font-size: clamp(0.875rem, 8cqi, 1.75rem);
    line-height: 1.1;
    text-transform: uppercase;
    white-space: nowrap;

    &::before {
      content: 'CHF PRO JAHR';
      font-family: ${[robotoMono.style.fontFamily, 'sans-serif'].join(',')};
      font-weight: 400;
      font-size: clamp(0.65rem, 4.5cqi, 1.1rem);
      letter-spacing: 0.05em;
    }
  }
`;
