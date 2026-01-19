import styled from '@emotion/styled';
import { BildwurfAdBlock as BildwurfAdBlockDefault } from '@wepublish/block-content/website';

export const TsriBildwurfAdBlock = styled(BildwurfAdBlockDefault)`
  background-color: rgb(
    from ${({ theme }) => theme.palette.primary.dark} r g b / 25%
  );
  padding: 0.5rem;

  & #bildwurf-ad-in-content {
    border-radius: 0.25rem;
    overflow: hidden;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 1.5rem;

    & #bildwurf-ad-in-content {
      border-radius: 0.75rem;
    }
  }
`;
