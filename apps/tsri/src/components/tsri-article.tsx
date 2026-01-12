import styled from '@emotion/styled';
import { Article as ArticleDefault } from '@wepublish/article/website';
import {
  ArticleInfoWrapper,
  ArticleListWrapper,
} from '@wepublish/article/website';
import {
  ImageBlockCaption,
  ImageBlockImage,
  TitleBlockPreTitleWrapper,
} from '@wepublish/block-content/website';
import { CommentListWrapper } from '@wepublish/comments/website';

import { SidebarContentWrapper } from './break-blocks/tsri-sidebar-content';

export const TsriArticle = styled(ArticleDefault)`
  ${TitleBlockPreTitleWrapper} {
    display: none;
  }

  ${ArticleInfoWrapper} {
    grid-row-start: 3;
    display: grid;
    gap: 0;
    grid-template-columns: min-content 1fr min-content;
  }

  ${ImageBlockImage} {
    border-radius: 1cqw;
  }

  ${ImageBlockCaption} {
    font-size: 1.12cqw;
    line-height: 1.58cqw;
    font-weight: 700;
  }

  @container main (width >= 200px) {
    grid-template-columns: var(--two-column-grid) !important;
    justify-content: space-between;

    & > * {
      grid-column: 1 / 2 !important;
    }
  }

  & ${SidebarContentWrapper} + * {
    margin-top: ${({ theme }) => theme.spacing(-3)};
  }

  & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
    grid-column: -1 / 1;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    //
  }
`;
