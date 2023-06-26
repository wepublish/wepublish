import {css} from '@emotion/react'
import {Theme} from '@mui/material'
import {ArticleInfoWrapper, ArticleWrapper, TitleBlockWrapper} from '@wepublish/website'

export const tsriArticleStyles = (theme: Theme) => css`
  ${ArticleWrapper} > * {
    grid-column-start: 1;
    grid-column-end: 12;

    &:is(${TitleBlockWrapper}):first-of-type {
      grid-row: 1;
      grid-column-start: 3;
      grid-column-end: 12;
    }
  }

  ${ArticleWrapper} ${ArticleInfoWrapper} {
    justify-self: flex-start;
    padding-top: ${theme.spacing(2)};
    gap: ${theme.spacing(4)};
    grid-row: 1;
    grid-column-start: 1;
    grid-column-end: 3;
    grid-auto-flow: row;

    & > * {
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: -${theme.spacing(2)};
        width: 40px;
        height: 1px;
        background-color: #000;
      }
    }
  }
`
