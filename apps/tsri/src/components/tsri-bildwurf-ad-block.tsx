import styled from '@emotion/styled';
import { BildwurfAdBlock as BildwurfAdBlockDefault } from '@wepublish/block-content/website';

export const TsriBildwurfAdBlock = styled(BildwurfAdBlockDefault)`
  & #bildwurf-ad-in-content {
    overflow: hidden;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin: 0 auto;
    width: 83%;
  }
`;
