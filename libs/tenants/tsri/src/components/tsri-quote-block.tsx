import styled from '@emotion/styled';
import { QuoteBlock } from '@wepublish/block-content/website';

export const TsriQuoteBlock = styled(QuoteBlock)`
  border: 0;
  margin: 0;
  padding: 0;

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0;
  }
`;
