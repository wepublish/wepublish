import styled from '@emotion/styled';
import { RadioGroup } from '@mui/material';
import {
  BuilderMemberPlanPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef, useEffect } from 'react';

import { eenewsColors } from '../theme';

/**
 * EE News v2 member-plan picker. Arranges plans in a 3-up grid (Mitlesen /
 * Unterstützen featured / Tragen). Hidden labels — the entire `EenewsMemberPlanItem`
 * is the click target.
 */
const Wrapper = styled('fieldset')`
  display: grid;
  gap: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  background: ${eenewsColors.ruleStrong};
  border-top: 1px solid ${eenewsColors.ruleStrong};
  border-bottom: 1px solid ${eenewsColors.ruleStrong};
`;

const Radios = styled(RadioGroup)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: ${eenewsColors.ruleStrong};

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }

  /* Hide MUI's default radio control + label wrapper — the card is the target. */
  label {
    margin: 0;
    display: grid;
    align-items: stretch;

    & > span {
      display: none;
    }
    & > span:nth-of-type(2) {
      display: contents;
    }
  }
`;

export const EenewsMemberPlanPicker = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanPickerProps & { alwaysShow?: boolean }
>(function EenewsMemberPlanPicker(
  { memberPlans, onChange, value, name, className },
  ref
) {
  const { MemberPlanItem } = useWebsiteBuilder();
  const selectedMemberPlan = memberPlans.find(({ id }) => id === value);

  useEffect(() => {
    if (memberPlans.length && !selectedMemberPlan) {
      onChange(memberPlans[0].id);
    }
  }, [memberPlans, onChange, selectedMemberPlan]);

  if (!memberPlans.length) {
    return null;
  }

  return (
    <Wrapper className={className}>
      <Radios
        name={name}
        onChange={event => onChange((event.target as HTMLInputElement).value)}
        value={value ?? ''}
        ref={ref}
      >
        {memberPlans.map(memberPlan => (
          <label key={memberPlan.id}>
            <input
              type="radio"
              value={memberPlan.id}
              name={name}
              defaultChecked={memberPlan.id === value}
              hidden
              onChange={() => onChange(memberPlan.id)}
            />
            <MemberPlanItem
              slug={memberPlan.slug}
              checked={memberPlan.id === value}
              name={memberPlan.name}
              currency={memberPlan.currency}
              amountPerMonthMin={memberPlan.amountPerMonthMin}
              amountPerMonthMax={memberPlan.amountPerMonthMax}
              extendable={memberPlan.extendable}
              shortDescription={memberPlan.shortDescription}
              tags={memberPlan.tags}
              onChange={() => onChange(memberPlan.id)}
            />
          </label>
        ))}
      </Radios>
    </Wrapper>
  );
});
