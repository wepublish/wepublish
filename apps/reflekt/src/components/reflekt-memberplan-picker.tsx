import styled from '@emotion/styled';
import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import {
  MemberPlanPicker,
  MemberPlanPickerRadios,
} from '@wepublish/membership/website';
import { BuilderMemberPlanPickerProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

export const StyledMemberPlanPicker = styled(MemberPlanPicker)`
  display: grid;

  ${MemberPlanPickerRadios} {
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

  ${RichTextBlockWrapper} {
    display: none;
  }
`;

export const ReflektMemberPlanPicker = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanPickerProps
>(function SortedMemberPlanPicker(props, ref) {
  return (
    <div id="MemberPlans">
      <StyledMemberPlanPicker
        {...props}
        ref={ref}
      />
    </div>
  );
});
