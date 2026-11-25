import styled from '@emotion/styled';
import { lighten } from '@mui/material';
import {
  hasBlockStyle,
  isSubscribeBlock,
  SubscribeBlock,
} from '@wepublish/block-content/website';
import {
  formatPeriodUnit,
  getPlanPeriodicities,
  PERIODICITY_ORDER,
  PeriodicityPicker,
  Subscribe,
  SubscribeButton,
  SubscribeCancelable,
  TransactionFee,
  TransactionFeeIcon,
} from '@wepublish/membership/website';
import {
  FullBlockFragment,
  FullMemberPlanFragment,
  PaymentPeriodicity,
  SubscribePeriodicityDisplay,
} from '@wepublish/website/api';
import {
  BuilderPeriodicityPickerProps,
  BuilderRouterContext,
  BuilderSubscribeBlockProps,
  BuilderSubscribeProps,
  BuilderSubscribeSummaryProps,
  SubscribeArea,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdCheck, MdFavorite } from 'react-icons/md';

import { formatMembershipPrice } from './tsri-membership-price';
import {
  TsriMembershipCustomAmountContext,
  TsriMembershipPlanPicker,
} from './tsri-membership-plan-picker';
import { TsriSubscribeType } from './tsri-subscribe-type';

export const isTsriMembershipSubscribe = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is BuilderSubscribeBlockProps =>
  allPass([hasBlockStyle(TsriSubscribeType.Membership), isSubscribeBlock])(
    block
  );

const AMOUNT_HIDDEN: readonly SubscribeArea[] = ['monthlyAmount'];
const NOTHING_HIDDEN: readonly SubscribeArea[] = [];

export const TsriMembershipWrapper = styled('div')`
  --tsri-membership-box: ${({ theme }) =>
    lighten(theme.palette.primary.light, 0.6)};
  --tsri-membership-box-width: 560px;
  display: grid;
  align-content: start;
`;

export const TsriMembershipSubscribeBlock = styled(SubscribeBlock)`
  row-gap: 0;

  [data-area='periodicity'] {
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  [data-area='memberPlans'],
  [data-area='monthlyAmount'] {
    margin-bottom: ${({ theme }) => theme.spacing(5)};
  }

  [data-area='memberPlans'] > h2 {
    display: none;
  }

  [data-area='monthlyAmount'] {
    justify-self: center;
    width: 100%;
    max-width: var(--tsri-membership-box-width);
  }

  [data-area='summary'],
  [data-area='userForm'],
  [data-area='paymentPeriodicity'],
  [data-area='goodie'],
  [data-area='discountCode'],
  [data-area='challenge'],
  [data-area='transactionFee'],
  [data-area='submit'],
  & > :not([data-area]) {
    justify-self: center;
    width: 100%;
    max-width: var(--tsri-membership-box-width);
    padding: ${({ theme }) => theme.spacing(1, 2)};
    background-color: var(--tsri-membership-box);
  }

  [data-area='summary'] {
    padding-top: ${({ theme }) => theme.spacing(2.5)};
    border-radius: ${({ theme }) => theme.spacing(0.5, 0.5, 0, 0)};
  }

  .MuiOutlinedInput-root {
    border-radius: 999px;
    background-color: ${({ theme }) => theme.palette.common.white};
  }

  .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.palette.common.black};
  }

  ${SubscribeCancelable} {
    display: none;
  }

  ${SubscribeButton} {
    position: relative;
    justify-self: stretch;
    border-radius: 999px;
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};

    svg {
      position: absolute;
      right: ${({ theme }) => theme.spacing(2.5)};
    }
  }
`;

export const TsriMembershipPeriodicityToggle = styled(PeriodicityPicker)`
  justify-self: end;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(0.5)};
  border: 1px solid ${({ theme }) => theme.palette.common.black};
  border-radius: 999px;
  background-color: ${({ theme }) => theme.palette.primary.light};

  .MuiToggleButton-root {
    margin: 0;
    padding: ${({ theme }) => theme.spacing(0.5, 1.5)};
    border: 0;
    border-radius: 999px;
    color: ${({ theme }) => theme.palette.common.black};
    font-weight: 700;
    font-size: 0.875rem;
    text-transform: none;
    white-space: nowrap;
    hyphens: manual;

    ${({ theme }) => theme.breakpoints.up('sm')} {
      padding: ${({ theme }) => theme.spacing(0.5, 2.5)};
      font-size: 1rem;
    }
  }

  .MuiToggleButton-root.Mui-selected {
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
  }
`;

const MembershipPlansContext = createContext<FullMemberPlanFragment[]>([]);

const offers = (
  memberPlan: FullMemberPlanFragment,
  periodicity: PaymentPeriodicity
) => getPlanPeriodicities(memberPlan).includes(periodicity);

/**
 * The monthly/yearly toggle offers every periodicity a plan of the block is
 * billed in, not only those of the selected plan. Choosing one the selected
 * plan lacks selects the first plan that offers it.
 */
const MembershipPeriodicityPicker = forwardRef<
  HTMLButtonElement,
  BuilderPeriodicityPickerProps
>(function MembershipPeriodicityPicker({ onChange, ...props }, ref) {
  const memberPlans = useContext(MembershipPlansContext);
  const form = useFormContext<{ memberPlanId: string }>();

  const periodicities = PERIODICITY_ORDER.filter(periodicity =>
    memberPlans.some(memberPlan => offers(memberPlan, periodicity))
  );

  return (
    <TsriMembershipPeriodicityToggle
      {...props}
      ref={ref}
      periodicities={periodicities.length ? periodicities : props.periodicities}
      onChange={periodicity => {
        const selected = memberPlans.find(
          ({ id }) => id === form?.getValues('memberPlanId')
        );
        const fallback = memberPlans.find(memberPlan =>
          offers(memberPlan, periodicity)
        );

        if (selected && !offers(selected, periodicity) && fallback) {
          form?.setValue('memberPlanId', fallback.id);
        }

        onChange(periodicity);
      }}
    />
  );
});

export const TsriMembershipTransactionFee = styled(TransactionFee)`
  justify-self: stretch;
  max-width: none;
  padding: 0;
  background: none;
  color: inherit;

  ${TransactionFeeIcon} {
    display: none;
  }

  .MuiCheckbox-root,
  .MuiCheckbox-root.Mui-checked {
    color: ${({ theme }) => theme.palette.common.black};
  }
`;

export const TsriMembershipSummaryText = styled('p')`
  margin: 0;
  font-weight: 700;
  text-align: center;
`;

export const TsriMembershipSummary = ({
  memberPlan,
  paymentPeriodicity,
  periodAmount,
  currency,
  className,
}: BuilderSubscribeSummaryProps) => {
  const { t } = useTranslation();
  const {
    meta: { locale },
  } = useWebsiteBuilder();

  if (!memberPlan) {
    return null;
  }

  return (
    <TsriMembershipSummaryText className={className}>
      {t('tsri.membership.summary', {
        memberPlan: memberPlan.name,
        price: formatMembershipPrice(periodAmount, currency, locale),
        unit: formatPeriodUnit(paymentPeriodicity),
      })}
    </TsriMembershipSummaryText>
  );
};

const MembershipSubscribe = (props: BuilderSubscribeProps) => {
  const { t } = useTranslation();

  return (
    <Subscribe
      {...props}
      transactionFeeText={t('tsri.membership.transactionFee')}
      submitText={
        <>
          {t('tsri.membership.submit')}
          <MdFavorite aria-hidden />
        </>
      }
    />
  );
};

export const TsriMembershipBenefits = styled('ul')`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  justify-self: center;
  gap: ${({ theme }) => theme.spacing(1, 3)};
  width: 100%;
  max-width: var(--tsri-membership-box-width);
  margin: 0;
  padding: ${({ theme }) => theme.spacing(1, 2, 2.5)};
  border-radius: ${({ theme }) => theme.spacing(0, 0, 0.5, 0.5)};
  background-color: var(--tsri-membership-box);
  list-style: none;
  font-size: 0.875rem;

  li {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(0.5)};
  }
`;

const BENEFITS = ['cancellable', 'securePayment', 'instantAccess'] as const;

export const TsriMembershipSubscribe = (props: BuilderSubscribeBlockProps) => {
  const { t } = useTranslation();
  const {
    query: { upgradeSubscriptionId },
  } = useContext(BuilderRouterContext);
  const [open, setOpen] = useState(false);
  const customAmount = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <MembershipPlansContext value={props.memberPlans}>
      <TsriMembershipCustomAmountContext value={customAmount}>
        <WebsiteBuilderProvider
          Subscribe={MembershipSubscribe}
          MemberPlanPicker={TsriMembershipPlanPicker}
          PeriodicityPicker={MembershipPeriodicityPicker}
          SubscribeSummary={TsriMembershipSummary}
          TransactionFee={TsriMembershipTransactionFee}
        >
          <TsriMembershipWrapper className={props.className}>
            <TsriMembershipSubscribeBlock
              {...props}
              className={undefined}
              periodicityDisplay={SubscribePeriodicityDisplay.Toggle}
              hiddenAreas={open ? NOTHING_HIDDEN : AMOUNT_HIDDEN}
            />

            {!upgradeSubscriptionId && (
              <TsriMembershipBenefits
                aria-label={t('tsri.membership.benefits.label')}
              >
                {BENEFITS.map(benefit => (
                  <li key={benefit}>
                    <MdCheck aria-hidden />
                    {t(`tsri.membership.benefits.${benefit}`)}
                  </li>
                ))}
              </TsriMembershipBenefits>
            )}
          </TsriMembershipWrapper>
        </WebsiteBuilderProvider>
      </TsriMembershipCustomAmountContext>
    </MembershipPlansContext>
  );
};
