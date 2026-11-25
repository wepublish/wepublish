import styled from '@emotion/styled';
import {
  findMemberPlanRenderSetting,
  getPeriodPriceRange,
  isAmountPickerLayout,
  isAmountSliderLayout,
  MemberPlanPicker,
  MemberPlanPickerRadios,
} from '@wepublish/membership/website';
import {
  FullMemberPlanFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import { BuilderMemberPlanPickerProps } from '@wepublish/website/builder';
import { createContext, forwardRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import {
  TsriMembershipPlanContent,
  TsriMembershipSelectedPlan,
} from './tsri-membership-plan-item';
import { getMembershipPeriodicity } from './tsri-membership-price';

type CustomAmount = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const TsriMembershipCustomAmountContext = createContext<CustomAmount>({
  open: false,
  setOpen: () => undefined,
});

export const TsriMembershipPlanPickerWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const TsriMembershipPlanList = styled(MemberPlanPicker)`
  ${MemberPlanPickerRadios} {
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: ${({ theme }) => theme.spacing(1)};

    ${({ theme }) => theme.breakpoints.up('md')} {
      gap: ${({ theme }) => theme.spacing(2.5)};
    }
  }

  /* the selected plan follows in full as its own card */
  & > :not(${MemberPlanPickerRadios}) {
    display: none;
  }
`;

export const TsriMembershipCustomAmountButton = styled('button')`
  justify-self: center;
  padding: ${({ theme }) => theme.spacing(1, 2.5)};
  border: 1px solid ${({ theme }) => theme.palette.common.black};
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.palette.common.black};
  font: inherit;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.palette.primary.light};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.common.black};
    outline-offset: 2px;
  }
`;

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

export const TsriMembershipPlanPicker = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanPickerProps
>(function TsriMembershipPlanPicker(props, ref) {
  const { t } = useTranslation();
  const customAmount = useContext(TsriMembershipCustomAmountContext);
  const selectedMemberPlan = props.memberPlans.find(
    ({ id }) => id === props.value
  );
  const periodicity =
    selectedMemberPlan &&
    getMembershipPeriodicity(selectedMemberPlan, props.paymentPeriodicity);

  return (
    <TsriMembershipPlanPickerWrapper className={props.className}>
      <TsriMembershipPlanList
        {...props}
        ref={ref}
        className={undefined}
        alwaysShow
      />

      {selectedMemberPlan && periodicity && (
        <TsriMembershipSelectedPlan
          isChecked
          aria-label={t('tsri.membership.selectedPlan')}
        >
          <TsriMembershipPlanContent
            memberPlan={selectedMemberPlan}
            periodicity={periodicity}
            checked
          />
        </TsriMembershipSelectedPlan>
      )}

      {selectedMemberPlan &&
        periodicity &&
        !customAmount.open &&
        offersCustomAmount(
          selectedMemberPlan,
          periodicity,
          props.memberPlanRenderSettings
        ) && (
          <TsriMembershipCustomAmountButton
            type="button"
            onClick={() => customAmount.setOpen(true)}
          >
            {t('tsri.membership.customAmount')}
          </TsriMembershipCustomAmountButton>
        )}
    </TsriMembershipPlanPickerWrapper>
  );
});
