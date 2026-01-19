import styled from '@emotion/styled';
import { TitleBlock, TitleBlockTitle } from '@wepublish/block-content/website';

export const TsriTitleBlock = styled(TitleBlock)`
  ${TitleBlockTitle} {
    font-size: 1.7rem;
    line-height: 2rem;
    padding-top: 2rem;
    font-weight: 700;

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 3rem;
      line-height: 3.5rem;
    }
  }
`;
