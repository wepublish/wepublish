import styled from '@emotion/styled';
import { Article as ArticleDefault } from '@wepublish/article/website';
import {
  ArticleInfoWrapper,
  ArticleListWrapper,
} from '@wepublish/article/website';
import {
  ImageBlockCaption,
  ImageBlockImage,
  TitleBlockPreTitle,
} from '@wepublish/block-content/website';
import { CommentListWrapper } from '@wepublish/comments/website';

import { SidebarContentWrapper } from './sidebar-content';

export const TsriArticle = styled(ArticleDefault)`
  ${TitleBlockPreTitle} {
    display: none;
  }

  ${ArticleInfoWrapper} {
    grid-row-start: 3;
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
    grid-template-columns: calc(100% - 2.2cqw - 33.75%) 33.75% !important;
    justify-content: space-between;

    & > * {
      grid-column: 1 / 2 !important;
    }
  }

  & ${SidebarContentWrapper} + * {
    margin-top: -56px;
  }

  & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
    grid-column: -1 / 1;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    //
  }
`;
