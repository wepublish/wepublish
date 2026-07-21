import styled from '@emotion/styled';
import { Radio, useRadioGroup } from '@mui/material';
import {
  hasBlockStyle,
  isSubscribeBlock,
} from '@wepublish/block-content/website';
import {
  CurrencyNumberSpinner,
  MemberPlanPickerRadios,
} from '@wepublish/membership/website';
import {
  BlockContent,
  SubscribeBlockPlanRenderStyle,
  useSubscriptionsQuery,
} from '@wepublish/website/api';
import {
  BuilderMemberPlanItemProps,
  BuilderRouterContext,
  BuilderSubscribeBlockProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ReflektBlockStyles } from './block-styles/reflekt-block-styles';
import { ReflektSubscribe } from './reflekt-subscribe';
import { euclidCircularB, robotoMono } from '../theme';

type CrowdfundingGoodieConfig = {
  goodieMinValue: number | null | undefined;
  baselineMonthlyAmount: number;
};

const CrowdfundingGoodieContext = createContext<CrowdfundingGoodieConfig>({
  goodieMinValue: undefined,
  baselineMonthlyAmount: 0,
});

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

const freeAmountBoxHeight = 'calc(clamp(1.25rem, 10cqi, 2.25rem) + 24px)';

const ItemFreeAmountSlot = styled('div')`
  width: 100%;
  height: clamp(3rem, 43cqi, 10rem);
  display: grid;
  align-content: center;
  justify-items: center;
`;

const ItemFreeAmountLabel = styled('span')`
  font-family: ${[robotoMono.style.fontFamily, 'sans-serif'].join(',')};
  font-weight: 400;
  font-size: clamp(0.8rem, 6.5cqi, 1.4rem);
  line-height: 1.3;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: center;
  white-space: normal;
  hyphens: manual;
  word-break: normal;
  overflow-wrap: normal;
  max-width: min(60%, 9ch);
`;

const ItemFreeAmountBox = styled('div')`
  position: relative;
  z-index: 1;
  width: 90%;
  min-height: ${freeAmountBoxHeight};
  justify-self: center;
  display: grid;
  align-content: center;
  justify-items: center;
  background-color: ${({ theme }) => theme.palette.common.white};
  color: ${({ theme }) => theme.palette.common.black};
  font-family: ${[euclidCircularB.style.fontFamily, 'sans-serif'].join(',')};
  font-weight: 500;
  font-size: clamp(1.25rem, 10cqi, 2.25rem);
  line-height: 1;
`;

const ItemFreeAmountSpinnerWrapper = styled('div')`
  position: relative;
  z-index: 3;
  width: 90%;
  justify-self: center;
`;

const ItemFreeAmountError = styled('span')`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  font-family: ${[robotoMono.style.fontFamily, 'sans-serif'].join(',')};
  font-size: clamp(0.65rem, 4.5cqi, 1rem);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: center;
  color: ${({ theme }) => theme.palette.error.main};
  pointer-events: none;
`;

const ItemFreeAmountSpinnerPlaceholder = styled(ItemFreeAmountLabel)`
  position: absolute;
  inset: 0 48px;
  max-width: none;
  display: grid;
  align-content: center;
  justify-items: center;
  pointer-events: none;
  color: ${({ theme }) => theme.palette.common.white};
`;

const ItemFreeAmountSpinner = styled(CurrencyNumberSpinner)`
  margin-top: 0;
  width: 100%;

  > div {
    width: 100%;
    min-height: ${freeAmountBoxHeight};
    border-radius: 0;
    justify-content: center;
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
  }

  > div > div {
    color: ${({ theme }) => theme.palette.common.white};
  }

  fieldset {
    border: none;
  }

  input {
    font-family: ${[euclidCircularB.style.fontFamily, 'sans-serif'].join(',')};
    font-weight: 500;
    font-size: clamp(1.25rem, 10cqi, 2.25rem);
    line-height: 1;
    height: auto;
    padding: ${({ theme }) => theme.spacing(1.5)} 0;
    text-align: center;
    color: inherit;
  }

  button {
    color: inherit;

    @media (hover: hover) {
      &:hover:not([disabled]) {
        color: inherit;
        background-color: rgba(127, 127, 127, 0.25);
      }
    }
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
    onMonthlyAmountChange,
    monthlyAmountError,
    renderStyle,
    tags,
    ...props
  },
  ref
) {
  const radioGroup = useRadioGroup();
  const isChecked = props.checked ?? radioGroup?.value === id;
  const { goodieMinValue, baselineMonthlyAmount } = useContext(
    CrowdfundingGoodieContext
  );

  const hasFreePricing =
    renderStyle === SubscribeBlockPlanRenderStyle.CardFreeInput;

  const [freeAmountYearly, setFreeAmountYearly] = useState<number | null>(null);

  const yearlyMinChf = Math.round((amountPerMonthMin * 12) / 100);
  const yearlyChf =
    hasFreePricing ? (freeAmountYearly ?? yearlyMinChf) : yearlyMinChf;
  const tileYearlyValue =
    (hasFreePricing ? (freeAmountYearly ?? 0) * 100 : amountPerMonthMin * 12) -
    baselineMonthlyAmount * 12;
  const hasGoodie =
    goodieMinValue != null ?
      tileYearlyValue >= goodieMinValue
    : !!goodies?.length;

  const lastPushed = useRef<{ amount: number; touched: boolean } | null>(null);

  useEffect(() => {
    if (!hasFreePricing || !isChecked) {
      lastPushed.current = null;
      return;
    }

    const touched = freeAmountYearly != null;
    const monthlyAmount =
      touched ? Math.round((freeAmountYearly * 100) / 12) : 0;

    if (
      lastPushed.current?.amount !== monthlyAmount ||
      lastPushed.current?.touched !== touched
    ) {
      lastPushed.current = { amount: monthlyAmount, touched };
      onMonthlyAmountChange?.(monthlyAmount, touched);
    }
  }, [hasFreePricing, isChecked, freeAmountYearly, onMonthlyAmountChange]);

  return (
    <ItemWrapper className={className}>
      <ItemImage
        src={hasGoodie ? '/with_goodie.png' : '/no_goodie.png'}
        alt=""
      />

      <ItemCard>
        <ItemAmountArea>
          {hasFreePricing && (
            <ItemFreeAmountSlot>
              {isChecked ?
                <ItemFreeAmountSpinnerWrapper>
                  <ItemFreeAmountSpinner
                    arrows="split"
                    min={yearlyMinChf}
                    step={10}
                    value={freeAmountYearly}
                    onValueChange={yearlyValue => {
                      if (yearlyValue != null) {
                        setFreeAmountYearly(yearlyValue);
                      }
                    }}
                  />

                  {freeAmountYearly == null && (
                    <ItemFreeAmountSpinnerPlaceholder>
                      Freier Betrag
                    </ItemFreeAmountSpinnerPlaceholder>
                  )}

                  {monthlyAmountError && (
                    <ItemFreeAmountError>
                      {monthlyAmountError}
                    </ItemFreeAmountError>
                  )}
                </ItemFreeAmountSpinnerWrapper>
              : <ItemFreeAmountBox>
                  {freeAmountYearly ?? (
                    <ItemFreeAmountLabel>Freier Betrag</ItemFreeAmountLabel>
                  )}
                </ItemFreeAmountBox>
              }
            </ItemFreeAmountSlot>
          )}

          {!hasFreePricing && <ItemAmount>{yearlyChf}</ItemAmount>}

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
) => {
  const {
    query: { upgradeSubscriptionId },
  } = useContext(BuilderRouterContext);

  const { data } = useSubscriptionsQuery({
    fetchPolicy: 'cache-only',
    skip: !upgradeSubscriptionId,
  });

  // On the upgrade flow the goodie threshold applies to the on-top delta
  // (new amount − current subscription amount), matching the core Upgrade.
  // In the plain subscribe flow there is no baseline, so it stays 0.
  const baselineMonthlyAmount = useMemo(() => {
    const subscription = data?.userSubscriptions.find(
      sub => sub.isActive && sub.id === upgradeSubscriptionId
    );

    return subscription?.monthlyAmount ?? 0;
  }, [data?.userSubscriptions, upgradeSubscriptionId]);

  return (
    <CrowdfundingGoodieContext.Provider
      value={{ goodieMinValue: props.goodieMinValue, baselineMonthlyAmount }}
    >
      <WebsiteBuilderProvider
        MemberPlanItem={ReflektCrowdfundingMemberPlanItem}
      >
        <CrowdfundingSubscribeBlock {...props} />
      </WebsiteBuilderProvider>
    </CrowdfundingGoodieContext.Provider>
  );
};
