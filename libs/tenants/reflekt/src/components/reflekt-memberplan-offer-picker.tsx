import styled from '@emotion/styled';
import {
  MemberPlanOfferPicker,
  MemberPlanOfferPickerRadios,
} from '@wepublish/membership/website';
import { BuilderMemberPlanOfferPickerProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

export const StyledMemberPlanOfferPicker = styled(MemberPlanOfferPicker)`
  display: grid;
  min-inline-size: 0;

  ${MemberPlanOfferPickerRadios} {
    grid-template-columns: repeat(2, 1fr);

    label {
      display: contents;
    }

    ${({ theme }) => theme.breakpoints.up('sm')} {
      display: grid;
      grid-template-columns: none;
      grid-auto-flow: column;
      grid-auto-columns: calc((100% - 3 * 1rem) / 4);
      justify-content: center;
      gap: 1rem;
    }
  }
`;

export const ReflektMemberPlanOfferPicker = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanOfferPickerProps
>(function ReflektMemberPlanOfferPicker(props, ref) {
  return (
    <div id="MemberPlans">
      <StyledMemberPlanOfferPicker
        {...props}
        ref={ref}
      />
    </div>
  );
});
