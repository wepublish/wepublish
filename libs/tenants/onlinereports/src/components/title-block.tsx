import styled from '@emotion/styled';
import {
  TitleBlock,
  TitleBlockLead,
  TitleBlockPreTitleWrapper,
  TitleBlockTitle,
} from '@wepublish/block-content/website';

export const OnlineReportsTitleBlock = styled(TitleBlock)`
  ${TitleBlockTitle} {
    margin-bottom: -${({ theme }) => theme.spacing(2)};
    font-size: ${({ theme }) => theme.typography.h1.fontSize};
    font-family: ${({ theme }) => theme.typography.h1.fontFamily};
    font-weight: ${({ theme }) => theme.typography.h1.fontWeight};
    &:has(+ ${TitleBlockLead}) {
      margin-bottom: -${({ theme }) => theme.spacing(2)};
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 44px;
    }
  }

  ${TitleBlockLead} {
    font-size: ${({ theme }) => theme.typography.body1.fontSize}px;
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: 0;
  }

  ${TitleBlockPreTitleWrapper} {
    display: none;
  }
`;
