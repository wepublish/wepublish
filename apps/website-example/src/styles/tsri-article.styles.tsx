import {css} from '@emotion/react'
import {Theme} from '@mui/material'
import {ArticleInfoWrapper, ArticleWrapper, TitleBlockWrapper} from '@wepublish/website'

export const tsriArticleStyles = (theme: Theme) => css`
  ${ArticleWrapper} > * {
    grid-column-start: 1;
    grid-column-end: 12;

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

  ${theme.breakpoints.up('md')} {
    ${ArticleWrapper} {
      align-items: flex-start;
    }

    ${ArticleWrapper} > * {
      &:is(${TitleBlockWrapper}):first-of-type {
        grid-row: 1;
        grid-column-start: 3;
        grid-column-end: 12;
      }
    }

    ${ArticleWrapper} ${ArticleInfoWrapper} {
      grid-row: 1;
      grid-auto-columns: max-content;
      grid-column-start: 1;
      grid-column-end: 3;

      & > * {
        &::before {
          top: -${theme.spacing(2)};
          width: 40px;
        }
      }
    }
  }
`
