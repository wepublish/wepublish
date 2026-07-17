import styled from '@emotion/styled';
import { Radio, useRadioGroup } from '@mui/material';
import {
  hasBlockStyle,
  isSubscribeBlock,
} from '@wepublish/block-content/website';
import { MemberPlanPickerRadios } from '@wepublish/membership/website';
import {
  BlockContent,
  SubscribeBlockPlanRenderStyle,
} from '@wepublish/website/api';
import {
  BuilderMemberPlanItemProps,
  BuilderSubscribeBlockProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { forwardRef } from 'react';

import { ReflektBlockStyles } from './block-styles/reflekt-block-styles';
import { ReflektSubscribe } from './reflekt-subscribe';
import { euclidCircularB, robotoMono } from '../theme';

const GOODIE_THRESHOLD_CHF_PER_YEAR = 120;

export const isCrowdFundingSubscribe = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderSubscribeBlockProps =>
  allPass([hasBlockStyle(ReflektBlockStyles.CrowdFunding), isSubscribeBlock])(
    block
  );

const ItemWrapper = styled('div')`
  container-type: inline-size;
  position: relative;
`;

const ItemImage = styled('img')`
  position: absolute;
  top: -30cqi;
  left: 50%;
  transform: translateX(-50%);
  height: 68cqi;
  width: auto;
  z-index: 1;
  pointer-events: none;
`;

const ItemCard = styled('div')`
  aspect-ratio: 1 / 1;
  display: grid;
  grid-template-rows: 40% 60%;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(1)};
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  position: relative;
  text-align: center;

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
    z-index: 2;
  }
`;

const ItemAmountArea = styled('div')`
  grid-row: 2;
  display: grid;
  align-content: space-between;
  justify-items: center;
`;

const ItemAmount = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${[euclidCircularB.style.fontFamily, 'sans-serif'].join(',')};
  font-weight: 500;
  font-size: clamp(3rem, 43cqi, 10rem);
  line-height: 1;
  white-space: nowrap;
`;

const ItemFreeAmount = styled('div')`
  display: grid;
  align-content: center;
  justify-items: center;
  width: 90%;
  padding: ${({ theme }) => theme.spacing(2, 1)};
  background-color: ${({ theme }) => theme.palette.common.white};
  color: ${({ theme }) => theme.palette.common.black};
  font-family: ${[robotoMono.style.fontFamily, 'sans-serif'].join(',')};
  font-size: clamp(0.8rem, 6.5cqi, 1.4rem);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;

  &::after {
    content: '';
    width: 100%;
    border-bottom: 1px solid currentColor;
    margin-top: ${({ theme }) => theme.spacing(1)};
  }

  ${ItemCard}:has(.Mui-checked) & {
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
  }
`;

const ItemPerYear = styled('span')`
  font-family: ${[robotoMono.style.fontFamily, 'sans-serif'].join(',')};
  font-weight: 400;
  font-size: clamp(0.65rem, 4.5cqi, 1.1rem);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  padding-bottom: ${({ theme }) => theme.spacing(1)};
`;

export const ReflektCrowdfundingMemberPlanItem = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanItemProps
>(function ReflektCrowdfundingMemberPlanItem(
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
    goodies,
    monthlyAmount,
    renderStyle,
    tags,
    ...props
  },
  ref
) {
  const radioGroup = useRadioGroup();
  const isChecked = props.checked ?? radioGroup?.value === id;

  const hasFreePricing =
    renderStyle === SubscribeBlockPlanRenderStyle.CardFreeInput;
  const relevantMonthlyAmount =
    hasFreePricing && isChecked && monthlyAmount != null ?
      monthlyAmount
    : amountPerMonthMin;
  const yearlyChf = Math.round((relevantMonthlyAmount * 12) / 100);
  const hasGoodie =
    !!goodies?.length ||
    (hasFreePricing && yearlyChf >= GOODIE_THRESHOLD_CHF_PER_YEAR);

  return (
    <ItemWrapper className={className}>
      <ItemImage
        src={hasGoodie ? '/with_goodie.png' : '/no_goodie.png'}
        alt=""
      />

      <ItemCard>
        <ItemAmountArea>
          {hasFreePricing ?
            <ItemFreeAmount>Freier Betrag</ItemFreeAmount>
          : <ItemAmount>{yearlyChf}</ItemAmount>}

          <ItemPerYear>{currency} pro Jahr</ItemPerYear>
        </ItemAmountArea>

        <Radio
          ref={ref}
          name={name}
          disableRipple={true}
          {...props}
        />
      </ItemCard>
    </ItemWrapper>
  );
});

const CrowdfundingSubscribeBlock = styled(ReflektSubscribe)`
  ${MemberPlanPickerRadios} {
    row-gap: ${({ theme }) => theme.spacing(12)};
    margin-top: ${({ theme }) => theme.spacing(10)};
    overflow: visible;

    ${({ theme }) => theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(3, 1fr) !important;
    }
  }
`;

export const ReflektSubscribeCrowdfunding = (
  props: BuilderSubscribeBlockProps
) => (
  <WebsiteBuilderProvider MemberPlanItem={ReflektCrowdfundingMemberPlanItem}>
    <CrowdfundingSubscribeBlock {...props} />
  </WebsiteBuilderProvider>
);
