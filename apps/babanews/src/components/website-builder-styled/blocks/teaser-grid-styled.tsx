import {css, styled} from '@mui/material'
import {TeaserGridBlock} from '@wepublish/website'

export const BabanewsTeaserGrid = styled(TeaserGridBlock)`
  ${({numColumns, theme}) =>
    numColumns > 1 &&
    css`
      row-gap: ${theme.spacing(3)};
      column-gap: ${theme.spacing(4)};
      padding-left: calc(100% / 28);
      padding-right: calc(100% / 28);
      align-items: center;

      ${theme.breakpoints.up('sm')} {
        grid-template-columns: repeat(12, 1fr);
        padding-left: calc(100% / 48);
        padding-right: calc(100% / 48);
        row-gap: ${theme.spacing(3)};
      }

      ${theme.breakpoints.up('md')} {
        row-gap: ${theme.spacing(6)};
        padding-left: calc(100% / 20);
        padding-right: calc(100% / 20);
        row-gap: ${theme.spacing(8)};
      }

      ${theme.breakpoints.up('xl')} {
        padding-left: calc(100% / 12);
        padding-right: calc(100% / 12);
        row-gap: ${theme.spacing(5)};
      }
    `}
`
