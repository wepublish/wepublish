import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Article as OriginalArticle,
  ArticleInfoWrapper,
} from '@wepublish/article/website';
import { BuilderArticleProps } from '@wepublish/website/builder';

export const Article = styled(OriginalArticle)<BuilderArticleProps>`
  ${({ hideContent }) =>
    hideContent &&
    css`
      // Reset the original hiding (n+4)
      > :nth-child(n + 4):not(:is(${ArticleInfoWrapper})) {
        display: block;
      }

      // Apply new hiding (n+5)
      > :nth-child(n + 5):not(:is(${ArticleInfoWrapper})) {
        display: none;
      }

      // Reset the original fade out on 3rd child
      > :nth-child(3) {
        max-height: none;
        mask-image: none;
        overflow-y: visible;
        overflow-x: visible;
      }
    `}
`;
