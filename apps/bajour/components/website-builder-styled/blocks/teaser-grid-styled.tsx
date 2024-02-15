import {css, styled} from '@mui/material'
import {TeaserGridBlock} from '@wepublish/website'

import {Archive} from '../../bajour/archive'

export const TeaserGridStyled = props => {
  console.log('props.teasers[0]', props.teasers[0])
  if (
    props.teasers.length === 6 &&
    props.teasers[0].style === 'LIGHT' &&
    props.teasers[0].__typename === 'ArticleTeaser'
  ) {
    console.log('archive dziwko')
    return <Archive {...props} />
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
