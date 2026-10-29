import styled from '@emotion/styled';
import { TitleBlock, TitleBlockTitle } from '@wepublish/block-content/website';

export const FlimmerTitle = styled(TitleBlock)`
  ${TitleBlockTitle} {
    ${({ theme }) => theme.breakpoints.down('sm')} {
      font-size: 2rem;
    }
  }
`;
