import styled from '@emotion/styled';
import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import {
  MemberPlanPicker,
  MemberPlanPickerRadios,
} from '@wepublish/membership/website';
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

export const ReflektMemberPlanPicker = styled(SortedMemberPlanPicker)`
  display: grid;

  ${MemberPlanPickerRadios} {
    grid-template-columns: repeat(2, 1fr);
    label {
      display: contents;
    }

    ${({ theme }) => theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  ${RichTextBlockWrapper} {
    display: none;
  }
`;
