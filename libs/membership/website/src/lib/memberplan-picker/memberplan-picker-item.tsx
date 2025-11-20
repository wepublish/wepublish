import { Radio, css, lighten, useRadioGroup } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderMemberPlanItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef } from 'react';
import { formatCurrency } from '../formatters/format-currency';
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

    return (
      <MemberPlanItemWrapper className={className}>
        <MemberPlanItemPicker isChecked={isChecked}>
          <MemberPlanItemContent>
            <MemberPlanItemName>{name}</MemberPlanItemName>

            <MemberPlanItemPrice>
              {t('subscribe.memberplan.price', {
                amountPerMonthMin,
                yearlyPrice: formatCurrency(
                  Math.ceil((amountPerMonthMin / 100) * 12),
                  currency,
                  locale
                ),
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
