import {
  alignmentForTeaserBlock,
  ApiV1,
  BuilderTeaserListBlockProps,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock,
  useWebsiteBuilder
} from '@wepublish/website'
import {allPass} from 'ramda'

import {Box, css, styled, useTheme} from '@mui/material'
import {RuckSpiegelTeaser} from '../custom-teasers/ruck-spiegel'
import {useMemo} from 'react'
import {Advertisement} from '../components/advertisement'
import {BlueBox} from '../components/blue-box'

export const isRuckSpiegelTeasers = (
  block: ApiV1.Block
): block is ApiV1.TeaserGridBlock | ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('RuckSpiegel'), isTeaserListBlock])(block)

const useLinkStyles = () => {
  const theme = useTheme()

  return useMemo(
    () => css`
      padding-top: ${theme.spacing(1.5)};
      color: ${theme.palette.accent.contrastText};
    `,
    [theme]
  )
}

export const AktuelleBildBlockStyle = ({
  title,
  teasers,
  blockStyle,
  className
}: Pick<BuilderTeaserListBlockProps, 'title' | 'teasers' | 'blockStyle' | 'className'>) => {
  const filledTeasers = teasers.filter(isFilledTeaser)
  const numColumns = 1

  const linkStyles = useLinkStyles()
  const {
    elements: {H3, Link}
  } = useWebsiteBuilder()

  return (
    <RuckSpiegelTeaserListWrapper>
      <BlueBox>
        <H3 gutterBottom>{title}</H3>
        {filledTeasers.map((teaser, index) => (
          <RuckSpiegelTeaser
            key={index}
            teaser={teaser}
            numColumns={numColumns}
            alignment={alignmentForTeaserBlock(index, numColumns)}
            blockStyle={blockStyle}
          />
        ))}
        <Link href={'/a/tag/ruckspiegel'} css={linkStyles}>
          Zum Archiv {'->'}
        </Link>
      </BlueBox>
      <Filler>
        <Advertisement type={'small'} />
      </Filler>
    </RuckSpiegelTeaserListWrapper>
  )
}

const Filler = styled(Box)``

const RuckSpiegelTeaserListWrapper = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({theme}) => theme.spacing(2.5)};

  ${BlueBox} {
    grid-column: span 3;
    ${({theme}) => theme.breakpoints.up('md')} {
      grid-column: span 2;
    }
  }

  ${Filler} {
    grid-column: span 3;
    ${({theme}) => theme.breakpoints.up('md')} {
      grid-column: span 1;
    }
  }
`
