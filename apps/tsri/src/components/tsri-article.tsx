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
  grid-template-columns: var(--two-column-grid) !important;
  justify-content: space-between;

  & > * {
    grid-column: 1 / 2 !important;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: unset;
  }

  ${TitleBlockPreTitleWrapper} {
    display: none;
  }

  ${ArticleInfoWrapper} {
    grid-row-start: 3;
    display: grid;
    gap: 0;
    grid-template-columns: unset;
    grid-template-columns: min-content 1fr;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: min-content 1fr;
    }
  }

  ${ImageBlockImage} {
    border-radius: 1rem;
    object-fit: cover;
    max-width: calc(100vw - ${({ theme }) => theme.spacing(4)});

    ${({ theme }) => theme.breakpoints.up('sm')} {
      max-width: calc(100vw - ${({ theme }) => theme.spacing(6)});
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      max-width: 100%;
    }
  }

  ${ImageBlockCaption} {
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 700;
  }

  & ${SidebarContentWrapper} + * {
    margin-top: ${({ theme }) => theme.spacing(-3)};
  }

  & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
    grid-column: -1 / 1;
  }

  & ${CommentListWrapper} {
    grid-column: -1 / 1 !important;
  }
`;
