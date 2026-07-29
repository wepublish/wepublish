import { Radio, css, lighten, useRadioGroup } from '@mui/material';
import styled from '@emotion/styled';
import { SubscribeBlockPlanRenderStyle } from '@wepublish/website/api';
import {
  BuilderMemberPlanItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef } from 'react';
import { formatCurrency } from '../formatters/format-currency';
import { CurrencyNumberSpinner } from '../payment-amount/payment-amount-picker/currency-number-spinner';
import { useTranslation } from 'react-i18next';

export const MemberPlanItemWrapper = styled('div')`
  --memberplan-item-picker-checked-bg: ${({ theme }) =>
    lighten(theme.palette.primary.main, 0.85)};
  display: flex;
  flex-flow: column;
  gap: ${({ theme }) => theme.spacing(2)};
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

export const MemberPlanItemDescription = styled('div')``;

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
>(
  (
    {
      className,
      id,
      name,
      slug,
      shortDescription,
      amountPerMonthMax,
      amountPerMonthMin,
      currency,
      extendable,
      monthlyAmount,
      onMonthlyAmountChange,
      monthlyAmountError,
      renderStyle,
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

    const hasFixedAmount =
      amountPerMonthMax != null && amountPerMonthMax === amountPerMonthMin;

    const hasInCardFreeInput =
      renderStyle === SubscribeBlockPlanRenderStyle.CardFreeInput;

    const displayedAmountPerMonth =
      (
        (renderStyle === SubscribeBlockPlanRenderStyle.CardAndSlider ||
          hasInCardFreeInput) &&
        isChecked &&
        monthlyAmount != null
      ) ?
        monthlyAmount
      : amountPerMonthMin;

    return (
      <MemberPlanItemWrapper className={className}>
        <MemberPlanItemPicker isChecked={isChecked}>
          <MemberPlanItemContent>
            <MemberPlanItemName>{name}</MemberPlanItemName>

            <MemberPlanItemPrice>
              {t('subscribe.memberplan.price', {
                amountPerMonthMin,
                yearlyPrice: formatCurrency(
                  Math.ceil((displayedAmountPerMonth / 100) * 12),
                  currency,
                  locale
                ),
                monthlyPrice: formatCurrency(
                  displayedAmountPerMonth / 100,
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
                  onMonthlyAmountChange?.(Math.round(spinnerValue * 100));
                }
              }}
              helperText={`Min ${formatCurrency(amountPerMonthMin / 100, currency, locale)}`}
            />
          )}

          {hasInCardFreeInput && isChecked && monthlyAmountError && (
            <MemberPlanItemAmountError>
              {monthlyAmountError}
            </MemberPlanItemAmountError>
          )}
        </MemberPlanItemPicker>

        {shortDescription && (
          <MemberPlanItemDescription>
            <RichText richText={shortDescription} />
          </MemberPlanItemDescription>
        )}
      </MemberPlanItemWrapper>
    );
  }
);
