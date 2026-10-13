import styled from '@emotion/styled';
import { QuoteBlock, QuoteContent } from '@wepublish/block-content/website';

export const WepQuoteBlock = styled(QuoteBlock)`
  margin-left: 0;
  border: none;
  ${({ theme }) => theme.breakpoints.up('xs')} {
    grid-template-columns: 155px auto;
    grid-template-rows: repeat(3, auto);
    padding: 0;
  }

  ${QuoteContent} {
    display: contents;
  }

  p {
    grid-column: 1 / -1;
    grid-row: 1 / 2;

    quotes: '\201E' '\201C';

    &::before {
      content: open-quote;
    }

    &::after {
      content: close-quote;
    }
  }

  img {
    grid-row: 2 / 4;
    grid-column: 1 / 2;
    justify-self: start;
    width: 100%;
    max-width: 155px;
  }

  cite {
    grid-row: 2 / 3;
    grid-column: 2 / 3;
  }
`;
