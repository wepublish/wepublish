import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  TitleBlock,
  TitleBlockLead,
  TitleBlockPreTitleWrapper,
  TitleBlockTitle,
} from '@wepublish/block-content/website';

import { designText } from '../theme';

/**
 * The opening block of a page: the pre-title as plain text, the title in the
 * size of H1 and the lead in the size of the paragraph.
 */
export const WepTitleBlock = styled(TitleBlock)`
  gap: 0;

  // On the 10 columns of the hero, the text a little narrower (1140 of 1270px in the design)
  ${({ theme }) => theme.breakpoints.up('md')} {
    max-width: calc(100% * 1140 / 1270);
  }

  ${TitleBlockPreTitleWrapper} {
    margin: 0 0 20px;
    padding: 0;
    background-color: transparent;
    color: inherit;
  }

  ${TitleBlockTitle} {
    ${designText.h1 as CSSObject}
    margin: 0;
    hyphens: manual;
  }

  ${TitleBlockLead} {
    margin: 40px 0 0;
    hyphens: manual;
  }
`;
