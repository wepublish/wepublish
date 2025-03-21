import {
  ApiV1,
  BuilderTeaserListBlockProps,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock,
  SliderInnerContainer,
  SliderTitle,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserSlider,
  TeaserTitle,
  useWebsiteBuilder
} from '@wepublish/website'
import {allPass} from 'ramda'

import {Box, styled, Typography} from '@mui/material'
import {
  OnlineReportsTeaserPreTitleWrapper,
  OnlineReportsTeaserTitleWrapper
} from '../onlinereports-base-teaser'

export const IsAktuelleBildTeasers = (
  block: ApiV1.Block
): block is ApiV1.TeaserGridBlock | ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('Aktuelle Bild'), isTeaserListBlock])(block)

export const AktuelleBild = ({
  title,
  teasers,
  blockStyle,
  className
}: Pick<BuilderTeaserListBlockProps, 'title' | 'teasers' | 'blockStyle' | 'className'>) => {
  const filledTeasers = teasers.filter(isFilledTeaser)
  const numColumns = 1

  const {
    elements: {H2, Link}
  } = useWebsiteBuilder()

  return (
    <AktuelleBildWrapper>
      <SideInfo>
        <H2>Das Wort zum Bild</H2>
        <Typography>
          Ein aktuelles Bild geschossen? Mailen Sie es uns (mit Adresse & Datum)!
        </Typography>
        <Link href={'/a/tag/ruckspiegel'}>
          <b>Zum Archiv {'->'}</b>
        </Link>
      </SideInfo>
      <TeaserSliderWrapper>
        <TeaserSlider
          teasers={filledTeasers}
          blockStyle={blockStyle}
          numColumns={numColumns}
          useSlidesPerView={() => 1}
        />
      </TeaserSliderWrapper>
    </AktuelleBildWrapper>
  )
}

const SideInfo = styled(Box)``
const TeaserSliderWrapper = styled(Box)``

const AktuelleBildWrapper = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({theme}) => theme.spacing(2.5)};

  ${TeaserSliderWrapper} {
    grid-column: span 3;

    ${({theme}) => theme.breakpoints.up('md')} {
      grid-column: span 2;
    }

    ${SliderTitle} {
      display: none;
    }
  }

  ${TeaserPreTitleWrapper},
  ${TeaserPreTitle},
  ${TeaserPreTitleNoContent},
  ${TeaserPreTitle},
  ${OnlineReportsTeaserTitleWrapper},
  ${OnlineReportsTeaserPreTitleWrapper},
  ${TeaserTitle},
  ${TeaserLead},
  ${TeaserMetadata} {
    display: none;
  }

  ${SliderInnerContainer} {
    gap: ${({theme}) => theme.spacing(2)};
  }

  ${SideInfo} {
    grid-column: span 1;
    display: flex;
    flex-direction: column;
    gap: ${({theme}) => theme.spacing(1)};

    ${({theme}) => theme.breakpoints.down('md')} {
      grid-column: span 3;
    }
  }
`
