import { FormControlLabel, RadioGroup } from '@mui/material';
import styled from '@emotion/styled';
import { toPlaintext } from '@wepublish/richtext';
import {
  BuilderMemberPlanPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef, useEffect } from 'react';

export const MemberPlanPickerWrapper = styled('fieldset')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  // reset fieldset values
  margin: unset;
  padding: unset;
  border: unset;
`;

export const MemberPlanPickerRadios = styled(RadioGroup)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};

  // hide unwanted label
  label {
    margin: 0;
    display: grid;
    align-items: stretch;

    & > span {
      display: none;
    }
  }
`;

export const MemberPlanPicker = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanPickerProps & { alwaysShow?: boolean }
>(function MemberPlanPicker(
  { memberPlans, onChange, value, className, name, alwaysShow },
  ref
) {
  const {
    MemberPlanItem,
    elements: { Image },
    blocks: { RichText },
  } = useWebsiteBuilder();

  const showRadioButtons = memberPlans.length > 1 || alwaysShow;
  const selectedMemberPlan = memberPlans.find(({ id }) => id === value);
  const showPicker =
    showRadioButtons ||
    toPlaintext(selectedMemberPlan?.description) ||
    selectedMemberPlan?.image;

  useEffect(() => {
    if (memberPlans.length && !selectedMemberPlan) {
      onChange(memberPlans[0].id);
    }
  }, [memberPlans, onChange, selectedMemberPlan]);

  return (
    showPicker && (
      <MemberPlanPickerWrapper className={className}>
        {showRadioButtons && (
          <MemberPlanPickerRadios
            name={name}
            onChange={event => onChange(event.target.value)}
            value={value ? value : ''}
            ref={ref}
          >
            {memberPlans.map(memberPlan => (
              <FormControlLabel
                key={memberPlan.id}
                value={memberPlan.id}
                control={
                  <MemberPlanItem
                    slug={memberPlan.slug}
                    key={memberPlan.id}
                    checked={memberPlan.id === value}
                    name={memberPlan.name}
                    currency={memberPlan.currency}
                    amountPerMonthMin={memberPlan.amountPerMonthMin}
                    amountPerMonthMax={memberPlan.amountPerMonthMax}
                    extendable={memberPlan.extendable}
                    shortDescription={memberPlan.shortDescription}
                    tags={memberPlan.tags}
                  />
                }
                label={memberPlan.name}
              />
            ))}
          </MemberPlanPickerRadios>
        )}

        {selectedMemberPlan?.image && (
          <Image image={selectedMemberPlan.image} />
        )}

        {!!selectedMemberPlan?.description?.length && (
          <RichText richText={selectedMemberPlan.description} />
        )}
      </MemberPlanPickerWrapper>
    )
  );
});
