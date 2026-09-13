import styled from '@emotion/styled';
import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import { MemberPlanPicker } from '@wepublish/membership/website';

export const EeNewsMemberPlanPicker = styled(MemberPlanPicker)`
  > ${RichTextBlockWrapper} {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: 1.5rem;
    font-weight: bold;
    min-height: auto;
    line-height: 1.3;

    * {
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
      color: #096b5f;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 2rem;
      width: 50%;
      margin: 0 auto;
      min-height: 220px;
    }
  }
`;
