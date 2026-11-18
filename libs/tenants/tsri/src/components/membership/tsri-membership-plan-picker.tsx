import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { lighten, Radio, RadioGroup, Theme } from '@mui/material';
import {
  findMemberPlanRenderSetting,
  formatPaymentTimeline,
  formatPeriodUnit,
  getDefaultPeriodicity,
  getPeriodPriceRange,
  getPlanPeriodicities,
  isAmountPickerLayout,
  isAmountSliderLayout,
} from '@wepublish/membership/website';
import {
  FullMemberPlanFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import {
  BuilderMemberPlanPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  formatMembershipPrice,
  getMembershipPrice,
} from './tsri-membership-price';

type CustomAmount = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const TsriMembershipCustomAmountContext = createContext<CustomAmount>({
  open: false,
  setOpen: () => undefined,
});

const black = ({ theme }: { theme: Theme }) => theme.palette.common.black;

export const TsriMembershipPlans = styled(RadioGroup)`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: ${({ theme }) => theme.spacing(2.5)};
  }
`;

const cardStyles = ({
  theme,
  checked,
}: {
  theme: Theme;
  checked: boolean;
}) => css`
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: ${theme.spacing(1)};
  background: linear-gradient(
    to bottom,
    ${theme.palette.primary.light},
    ${lighten(theme.palette.primary.light, 0.7)}
  );
  color: ${theme.palette.common.black};

  ${
    checked &&
    css`
      border-color: ${theme.palette.common.black};
    `
  }
`;

export const TsriMembershipPlanCard = styled('label', {
  shouldForwardProp: prop => prop !== 'checked' && prop !== 'disabled',
})<{ checked: boolean; disabled: boolean }>`
  ${cardStyles}
  cursor: pointer;

  &:has(input:focus-visible) {
    outline: 2px solid ${black};
    outline-offset: 2px;
  }

  ${({ disabled }) =>
    disabled &&
    css`
      cursor: not-allowed;
      opacity: 0.6;
    `}

  .MuiRadio-root {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }
`;

export const TsriMembershipSelectedPlan = styled('section', {
  shouldForwardProp: prop => prop !== 'checked',
})<{ checked: boolean }>`
  ${cardStyles}

  ${({ theme }) => theme.breakpoints.up('md')} {
    display: none;
  }
`;

export const TsriMembershipPlanHeader = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(0.5, 1.5)};
  background-color: ${black};
  color: ${({ theme }) => theme.palette.common.white};
  font-weight: 700;
  font-size: 1.125rem;

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(0.75, 2)};
    font-size: 1.25rem;
  }

  img {
    display: block;
    width: 1.5em;
    height: 1.5em;
    object-fit: contain;
  }
`;

export const TsriMembershipPlanBody = styled('div')`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(1.5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(3, 5, 2)};
  }
`;

export const TsriMembershipPlanPrice = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: ${({ theme }) => theme.spacing(0.5)};
`;

export const TsriMembershipPlanAmount = styled('span')`
  font-size: 1rem;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
  }
`;

export const TsriMembershipPlanUnit = styled('span')`
  font-size: 1rem;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-weight: 700;
  }
`;

export const TsriMembershipPlanDetails = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  align-content: start;

  p {
    margin: 0;
  }

  ul {
    display: grid;
    gap: ${({ theme }) => theme.spacing(1.5)};
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    position: relative;
    padding-left: 1.5em;

    &::before {
      content: '✓';
      position: absolute;
      left: 0;
      font-weight: 700;
    }
  }
`;

export const TsriMembershipPlanShortDescription = styled('div')`
  font-weight: 700;
`;

export const TsriMembershipPlanUnavailable = styled('div')`
  font-style: italic;
`;

export const TsriMembershipPlanSelect = styled('span', {
  shouldForwardProp: prop => prop !== 'checked',
})<{ checked: boolean }>`
  align-self: center;
  margin-top: auto;
  padding: ${({ theme }) => theme.spacing(0.5, 2)};
  border-radius: 999px;
  font-weight: 700;
  background-color: ${({ theme }) => theme.palette.common.white};
  color: ${black};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(0.75, 3)};
    font-size: 1.125rem;
  }

  ${({ checked, theme }) =>
    checked &&
    css`
      background-color: ${theme.palette.common.black};
      color: ${theme.palette.common.white};
    `}
`;

const OptionCard = styled(TsriMembershipPlanCard)`
  ${({ theme }) => theme.breakpoints.down('md')} {
    ${TsriMembershipPlanDetails} {
      display: none;
    }
  }
`;

const PickerWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const TsriMembershipCustomAmountButton = styled('button')`
  justify-self: center;
  padding: ${({ theme }) => theme.spacing(1, 2.5)};
  border: 1px solid ${black};
  border-radius: 999px;
  background: transparent;
  color: ${black};
  font: inherit;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.palette.primary.light};
  }

  &:focus-visible {
    outline: 2px solid ${black};
    outline-offset: 2px;
  }
`;

type PlanContentProps = {
  memberPlan: FullMemberPlanFragment;
  periodicity: PaymentPeriodicity;
  checked: boolean;
  unavailable: boolean;
  detailsId?: string;
};

const PlanContent = ({
  memberPlan,
  periodicity,
  checked,
  unavailable,
  detailsId,
}: PlanContentProps) => {
  const { t } = useTranslation();
  const {
    elements: { Image },
    blocks: { RichText },
    meta: { locale },
  } = useWebsiteBuilder();
  const { periodAmount, monthlyAmount } = getMembershipPrice(
    memberPlan,
    periodicity
  );
  const price = (cents: number) =>
    formatMembershipPrice(cents, memberPlan.currency, locale);

  return (
    <>
      <TsriMembershipPlanHeader>
        <span>{memberPlan.name}</span>

        {memberPlan.image && (
          <span aria-hidden>
            <Image image={memberPlan.image} />
          </span>
        )}
      </TsriMembershipPlanHeader>

      <TsriMembershipPlanBody>
        <TsriMembershipPlanPrice>
          <TsriMembershipPlanAmount>
            {price(monthlyAmount)}
          </TsriMembershipPlanAmount>
          <TsriMembershipPlanUnit>
            {t('tsri.membership.perMonth')}
          </TsriMembershipPlanUnit>
        </TsriMembershipPlanPrice>

        <TsriMembershipPlanDetails id={detailsId}>
          <div>
            {periodicity === PaymentPeriodicity.Monthly ?
              t('tsri.membership.billedMonthly')
            : t('tsri.membership.billedPeriodically', {
                price: price(periodAmount),
                unit: formatPeriodUnit(periodicity),
                timeline: formatPaymentTimeline(periodicity),
              })
            }
          </div>

          {unavailable && (
            <TsriMembershipPlanUnavailable>
              {t('subscribe.memberplan.periodicityUnavailable')}
            </TsriMembershipPlanUnavailable>
          )}

          {!!memberPlan.shortDescription?.content?.length && (
            <TsriMembershipPlanShortDescription>
              <RichText richText={memberPlan.shortDescription} />
            </TsriMembershipPlanShortDescription>
          )}

          {!!memberPlan.description?.content?.length && (
            <RichText richText={memberPlan.description} />
          )}
        </TsriMembershipPlanDetails>

        <TsriMembershipPlanSelect
          checked={checked}
          aria-hidden
        >
          {checked ?
            t('tsri.membership.selected')
          : t('tsri.membership.select')}
        </TsriMembershipPlanSelect>
      </TsriMembershipPlanBody>
    </>
  );
};

const OptionPlan = ({
  memberPlan,
  ...props
}: Omit<PlanContentProps, 'detailsId'>) => {
  const detailsId = useId();

  return (
    <OptionCard
      checked={props.checked}
      disabled={props.unavailable}
    >
      <Radio
        value={memberPlan.id}
        disabled={props.unavailable}
        disableRipple
        slotProps={{
          input: {
            'aria-label': memberPlan.name,
            'aria-describedby': detailsId,
          },
        }}
      />

      <PlanContent
        memberPlan={memberPlan}
        detailsId={detailsId}
        {...props}
      />
    </OptionCard>
  );
};

const offersCustomAmount = (
  memberPlan: FullMemberPlanFragment,
  periodicity: PaymentPeriodicity,
  memberPlanRenderSettings: BuilderMemberPlanPickerProps['memberPlanRenderSettings']
) => {
  const layout = findMemberPlanRenderSetting(
    memberPlanRenderSettings,
    memberPlan.id
  )?.layout;
  const { amountMin, amountMax } = getPeriodPriceRange(memberPlan, periodicity);

  return (
    amountMin !== amountMax &&
    (isAmountPickerLayout(layout) || isAmountSliderLayout(layout))
  );
};

export const TsriMembershipPlanPicker = ({
  memberPlans,
  onChange,
  value,
  className,
  name,
  paymentPeriodicity,
  requiredPeriodicity,
  memberPlanRenderSettings,
}: BuilderMemberPlanPickerProps) => {
  const { t } = useTranslation();
  const customAmount = useContext(TsriMembershipCustomAmountContext);
  const selectedMemberPlan = memberPlans.find(({ id }) => id === value);

  const isUnavailable = useCallback(
    (memberPlan: FullMemberPlanFragment) =>
      !!requiredPeriodicity &&
      !getPlanPeriodicities(memberPlan).includes(requiredPeriodicity),
    [requiredPeriodicity]
  );

  const periodicityOf = (memberPlan: FullMemberPlanFragment) =>
    paymentPeriodicity ??
    getDefaultPeriodicity(memberPlan) ??
    PaymentPeriodicity.Monthly;

  useEffect(() => {
    if (!memberPlans.length || selectedMemberPlan) {
      return;
    }

    const available = memberPlans.find(
      memberPlan => !isUnavailable(memberPlan)
    );

    onChange((available ?? memberPlans[0]).id);
  }, [memberPlans, onChange, selectedMemberPlan, isUnavailable]);

  return (
    <PickerWrapper className={className}>
      <TsriMembershipPlans
        name={name}
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
      >
        {memberPlans.map(memberPlan => (
          <OptionPlan
            key={memberPlan.id}
            memberPlan={memberPlan}
            periodicity={periodicityOf(memberPlan)}
            checked={memberPlan.id === value}
            unavailable={isUnavailable(memberPlan)}
          />
        ))}
      </TsriMembershipPlans>

      {selectedMemberPlan && (
        <TsriMembershipSelectedPlan
          checked
          aria-label={t('tsri.membership.selectedPlan')}
        >
          <PlanContent
            memberPlan={selectedMemberPlan}
            periodicity={periodicityOf(selectedMemberPlan)}
            checked
            unavailable={isUnavailable(selectedMemberPlan)}
          />
        </TsriMembershipSelectedPlan>
      )}

      {selectedMemberPlan &&
        !customAmount.open &&
        offersCustomAmount(
          selectedMemberPlan,
          periodicityOf(selectedMemberPlan),
          memberPlanRenderSettings
        ) && (
          <TsriMembershipCustomAmountButton
            type="button"
            onClick={() => customAmount.setOpen(true)}
          >
            {t('tsri.membership.customAmount')}
          </TsriMembershipCustomAmountButton>
        )}
    </PickerWrapper>
  );
};
