import styled from '@emotion/styled'
import {css} from '@mui/material'
import {ArticleListWrapper} from '@wepublish/article/website'
import {BreakBlockWrapper} from '@wepublish/block-content/website'
import {EventBlockWrapper, ImageBlockWrapper, SliderWrapper} from '@wepublish/block-content/website'
import {CommentListWrapper} from '@wepublish/comments/website'
import {ContentWrapperStyled} from '@wepublish/content/website'

export const HauptstadtContentWrapper = styled(ContentWrapperStyled)`
  display: grid;
  row-gap: ${({theme}) => theme.spacing(7)};

  ${({theme, fullWidth}) =>
    !fullWidth &&
    css`
      ${theme.breakpoints.up('md')} {
        grid-template-columns: repeat(36, 1fr);

        & > * {
          grid-column: 8/30;
        }

        & > :is(${ImageBlockWrapper}, ${SliderWrapper}, ${EventBlockWrapper}) {
          grid-column: 6/32;
        }

        & > :is(${BreakBlockWrapper}) {
          grid-column: 9/29;
        }

        & > ${ArticleListWrapper}, & > ${CommentListWrapper} {
          grid-column: 6/32 !important;
        }
      }
    `}
`
