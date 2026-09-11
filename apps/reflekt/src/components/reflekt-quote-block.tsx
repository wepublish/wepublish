import styled from '@emotion/styled';
import {
  QuoteBlock,
  QuoteBlockWrapper,
} from '@wepublish/block-content/website';

export const ReflektQuoteBlock = styled(QuoteBlock)`
  border: 0;
  margin: 0;
  font-style: normal;
  text-align: center;
  font-size: 3rem;

  & p {
    quotes: '«' '»' '‹' '›';

    &::before {
      content: open-quote;
    }

    &::after {
      content: close-quote;
    }
  }

  & cite {
    font-style: normal;
    text-transform: uppercase;
  }

  &:has(+ ${QuoteBlockWrapper}) {
    padding-bottom: 0;
  }

  &:is(${QuoteBlockWrapper} + ${QuoteBlockWrapper}) {
    padding-top: 0;
  }
`;
