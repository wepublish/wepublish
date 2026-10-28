import styled from '@emotion/styled';
import { QuoteBlock } from '@wepublish/block-content/website';

export const HauptstadtQuoteBlock = styled(QuoteBlock)`
  border: 0;
  padding: 40px 0;
  margin: 0;

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 40px 0;
    margin-left: calc(100% / 9);
    margin-right: calc(100% / 9);
  }
`;
