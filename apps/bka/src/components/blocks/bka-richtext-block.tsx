import styled from '@emotion/styled';
import { RichTextBlock } from '@wepublish/block-content/website';

export const BkaRichTextBlock = styled(RichTextBlock)`
  white-space: normal;
  overflow-wrap: normal;

  h2 {
    margin: 0 0 ${({ theme }) => theme.spacing(2.5)};
    font-family: ${({ theme }) => theme.typography.h1.fontFamily};
    font-size: calc(1.4586rem + 1.55vw);
    font-weight: 400;
    line-height: ${({ theme }) => theme.typography.h1.lineHeight};
    text-wrap: wrap;
    hyphens: manual;
    word-break: normal;
    overflow-wrap: normal;

    ${({ theme }) => theme.breakpoints.up('lg')} {
      font-size: ${({ theme }) => theme.typography.h1.fontSize};
    }
  }

  h3 {
    margin: 0 0 ${({ theme }) => theme.spacing(3)};
    font-family: ${({ theme }) => theme.typography.h1.fontFamily};
    font-size: calc(1.3021rem + 0.3875vw);
    font-weight: 400;
    line-height: ${({ theme }) => theme.typography.h3.lineHeight};
    text-wrap: wrap;
    hyphens: manual;
    word-break: normal;
    overflow-wrap: normal;

    ${({ theme }) => theme.breakpoints.up('lg')} {
      font-size: ${({ theme }) => theme.typography.subtitle1.fontSize};
    }
  }

  && p {
    margin: 0 0 ${({ theme }) => theme.spacing(2)};
    white-space: normal;
    text-wrap: wrap;
    hyphens: manual;
    word-break: normal;
    overflow-wrap: normal;
  }
`;
