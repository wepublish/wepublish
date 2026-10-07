import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  TitleBlock,
  TitleBlockLead,
  TitleBlockTitle,
} from '@wepublish/block-content/website';

export const BkaTitleBlock = styled(TitleBlock)`
  gap: 0;

  ${TitleBlockTitle} {
    ${({ theme }) => css(theme.typography.h1)}
  }

  ${TitleBlockLead} {
    margin: 0;
  }
`;
