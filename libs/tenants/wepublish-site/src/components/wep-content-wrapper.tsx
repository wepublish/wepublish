import styled from '@emotion/styled';
import { ContentWrapperStyled } from '@wepublish/content/website';

/** Space between the blocks of a page, in theme spacing units. */
export const blockGap = { xs: 5, md: 15 };

export const WepContentWrapper = styled(ContentWrapperStyled)`
  row-gap: ${({ theme }) => theme.spacing(blockGap.xs)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: ${({ theme }) => theme.spacing(blockGap.md)};
  }
`;
