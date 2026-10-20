import styled from '@emotion/styled';
import { RichTextBlock } from '@wepublish/block-content/website';

export const BkaDefaultRichTextBlock = styled(RichTextBlock)`
  h2 {
    margin: ${({ theme }) => theme.spacing(0, 0, 2.5)};
    font-family: ${({ theme }) => theme.typography.h1.fontFamily};
    font-size: calc(1.4586rem + 1.55vw);
    font-weight: 400;
    line-height: ${({ theme }) => theme.typography.h1.lineHeight};

    ${({ theme }) => theme.breakpoints.up('lg')} {
      font-size: ${({ theme }) => theme.typography.h1.fontSize};
    }
  }

  h3 {
    margin: ${({ theme }) => theme.spacing(0, 0, 3)};
    font-family: ${({ theme }) => theme.typography.h1.fontFamily};
    font-size: calc(1.3021rem + 0.3875vw);
    font-weight: 400;
    line-height: ${({ theme }) => theme.typography.h3.lineHeight};

    ${({ theme }) => theme.breakpoints.up('lg')} {
      font-size: ${({ theme }) => theme.typography.subtitle1.fontSize};
    }
  }

  h4 {
    margin: ${({ theme }) => theme.spacing(0, 0, 3)};
    font-family: ${({ theme }) => theme.typography.h1.fontFamily};
    font-size: calc(1.4238rem + 1.2918vw);
    font-weight: 400;
    line-height: ${({ theme }) => theme.typography.h1.lineHeight};

    ${({ theme }) => theme.breakpoints.up('lg')} {
      font-size: 2.5rem;
    }
  }

  && p {
    margin: ${({ theme }) => theme.spacing(0, 0, 2)};
    white-space: normal;
  }
`;
