import {css, styled} from '@mui/material'
import {TeaserGridBlock} from '@wepublish/website'

import {BestOfWePublish} from '../../bajour/best-of-wepublish'

export const TeaserGridStyled = props => {
  if (
    props.teasers.length === 6 &&
    props.teasers[0].style === 'DEFAULT' &&
    props.teasers[0].__typename === 'PeerArticleTeaser'
  ) {
    return <BestOfWePublish {...props} />
  }

  return <TeaserGridStyledCss {...props} />
}

export const TeaserGridStyledCss = styled(TeaserGridBlock)`
  ${({numColumns, theme}) =>
    numColumns > 1 &&
    css`
      grid-template-columns: repeat(12, 1fr);
      row-gap: ${theme.spacing(2)};
      column-gap: ${theme.spacing(4)};
      align-items: center;

      ${theme.breakpoints.up('sm')} {
        grid-template-columns: repeat(12, 1fr);
        padding-left: calc(100% / 48);
        padding-right: calc(100% / 48);
        row-gap: ${theme.spacing(3)};
      }

      ${theme.breakpoints.up('md')} {
        padding-left: calc((100% / 12) * 2);
        padding-right: calc((100% / 12) * 2);
        row-gap: ${theme.spacing(4)};
      }

      ${theme.breakpoints.up('xl')} {
        padding-left: calc((100% / 12) * 5);
        padding-right: calc((100% / 12) * 7);
        row-gap: ${theme.spacing(5)};
      }
    `}
`
