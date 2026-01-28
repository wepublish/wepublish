import { css } from '@emotion/react';
import { Theme } from '@mui/material';
import { ArticleInfoWrapper, ArticleWrapper } from '@wepublish/article/website';
import { TitleBlockWrapper } from '@wepublish/block-content/website';

import { ArticleTagList } from '../../pages/a/[slug]';

export const tsriArticleStyles = (theme: Theme) => css`
  ${ArticleWrapper} {
    align-items: start;

    ${theme.breakpoints.up('lg')} {
      padding-right: ${theme.spacing(26)};
    }
  }

  ${ArticleWrapper} > * {
    grid-column: 1 / -1;

    &:is(${TitleBlockWrapper}):first-of-type {
      grid-row: 1;
    }
  }

  ${ArticleWrapper} ${ArticleInfoWrapper} {
    width: 100%;
    justify-self: flex-start;
    padding-top: ${theme.spacing(2)};
    gap: ${theme.spacing(4)};
    grid-auto-flow: row;
    grid-auto-columns: 1fr;
    grid-row: 2;

    & > * {
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: -${theme.spacing(2)};
        width: 100%;
        height: 1px;
        background-color: #000;
      }
    }
  }

  ${ArticleWrapper} ${ArticleTagList} {
    grid-row: 3;
    margin-top: -${theme.spacing(1)};
    padding-top: ${theme.spacing(2)};
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      width: 100%;
      height: 1px;
      background-color: #000;
    }
  }

  ${theme.breakpoints.up('md')} {
    ${ArticleWrapper} {
      grid-template-columns: 350px repeat(11, 1fr);
      align-items: flex-start;
    }

    ${ArticleWrapper} > * {
      &:is(${TitleBlockWrapper}):first-of-type {
        grid-row-start: 1;
        grid-row-end: 3;
        grid-column: 2 / -1;
      }
    }

    ${ArticleWrapper} ${ArticleInfoWrapper} {
      grid-row: 1;
      grid-auto-columns: max-content;
      grid-column-start: 1;
      grid-column-end: 1;

      & > * {
        &::before {
          top: -${theme.spacing(2)};
          width: 40px;
        }
      }
    }

    ${ArticleWrapper} ${ArticleTagList} {
      grid-row: 2;
      grid-column-start: 1;
      grid-column-end: 1;

      &::before {
        width: 40px;
      }
    }
  }
`;
