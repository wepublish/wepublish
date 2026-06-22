import styled from '@emotion/styled';
import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import { MemberPlanPicker } from '@wepublish/membership/website';
import { BuilderMemberPlanPickerProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

const SortedMemberPlanPicker = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanPickerProps
>(function SortedMemberPlanPicker(props, ref) {
  return (
    <MemberPlanPicker
      {...props}
      ref={ref}
      sortBy="priceAsc"
    />
  );
});

export const EeNewsMemberPlanPicker = styled(SortedMemberPlanPicker)`
  > ${RichTextBlockWrapper} {
    font-size: 1.5rem;
    font-weight: bold;
    min-height: 140px;

    * {
      font-size: inherit;
      font-weight: inherit;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 2rem;
      width: 50%;
      margin: 0 auto;
      min-height: 140px;
    }
  }
`;
