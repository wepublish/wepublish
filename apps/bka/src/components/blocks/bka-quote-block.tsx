import styled from '@emotion/styled';
import { QuoteBlock, QuoteContent } from '@wepublish/block-content/website';

export const BkaQuoteBlock = styled(QuoteBlock)`
  gap: 0;
  margin-left: 0;
  padding: 0;
  border-top: 0;
  border-bottom: 0;

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0;
  }

  ${QuoteContent} {
    justify-items: start;
    gap: ${({ theme }) => theme.spacing(2)};
    text-align: start;
  }

  p {
    margin: 0;
    font-family: ${({ theme }) => theme.typography.body1.fontFamily};
    font-size: calc(1.3717rem + 0.9042vw);
    font-weight: 400;
    font-style: italic;
    line-height: 1.2;
    text-wrap: wrap;

    ${({ theme }) => theme.breakpoints.up('lg')} {
      font-size: 2.125rem;
    }
  }

  cite {
    font-size: ${({ theme }) => theme.typography.body1.fontSize};
    font-style: normal;
    line-height: ${({ theme }) => theme.typography.body1.lineHeight};

    &::before {
      content: '— ';
    }
  }
`;
