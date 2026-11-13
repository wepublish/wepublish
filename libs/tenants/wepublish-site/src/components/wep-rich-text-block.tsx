import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { RichTextBlock } from '@wepublish/block-content/website';

import { designText } from '../theme';

/**
 * A quote in the text highlights a passage: in the size of H3 and wider than
 * the text around it (1010 instead of 750 of the 1273px in the design).
 */
export const WepRichTextBlock = styled(RichTextBlock)`
  blockquote {
    margin: 40px 0;

    ${({ theme }) => theme.breakpoints.up('md')} {
      margin: 80px calc(100% * -130 / 750);
    }

    ${({ theme }) => theme.breakpoints.up('lg')} {
      margin-block: 120px;
    }
  }

  blockquote,
  blockquote p {
    ${designText.h3 as CSSObject}
    hyphens: manual;
  }

  blockquote p {
    margin: 0;
  }
`;
