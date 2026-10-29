import styled from '@emotion/styled';
import { ArticleList } from '@wepublish/article/website';
import { TeaserGridBlockWrapper } from '@wepublish/block-content/website';

export const TsriArticleList = styled(ArticleList)`
  grid-column: -1 / 1 !important;
  ${TeaserGridBlockWrapper} {
    row-gap: 16px;
  }
`;
