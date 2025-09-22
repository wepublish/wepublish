import styled from '@emotion/styled'
import {Box, Typography} from '@mui/material'
import {
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock,
  SliderArrow,
  SliderBallContainer,
  SliderInnerContainer,
  SliderTitle,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserSlider,
  TeaserTitle,
  TeaserWrapper
} from '@wepublish/block-content/website'
import {BlockContent, TeaserGridBlock, TeaserListBlock} from '@wepublish/website/api'
import {BuilderTeaserListBlockProps, Link, useWebsiteBuilder} from '@wepublish/website/builder'
import {allPass} from 'ramda'

import {
  OnlineReportsBaseTeaserStyled,
  OnlineReportsTeaserPreTitleWrapper,
  OnlineReportsTeaserTitleWrapper
} from '../onlinereports-base-teaser'

export const IsAktuelleBildTeasers = (
  block: BlockContent
): block is TeaserGridBlock | TeaserListBlock =>
  allPass([hasBlockStyle('Aktuelle Bild'), isTeaserListBlock])(block)

export const AktuelleBild = ({
  teasers,
  blockStyle,
  className
}: Pick<BuilderTeaserListBlockProps, 'title' | 'teasers' | 'blockStyle' | 'className'>) => {
  const filledTeasers = teasers.filter(isFilledTeaser)
  const numColumns = 1

  const {
    elements: {H2}
  } = useWebsiteBuilder()

  return (
    <AktuelleBildWrapper className={className}>
      <SideInfo>
        <H2>Das Wort zum Bild</H2>
        <Typography>
          Ein interessantes Bild geschossen?{' '}
          <Link href={'mailto:redaktion@onlinereports.ch?subject=Das Wort zum Build'}>
            Mailen Sie es uns
          </Link>{' '}
          (mit Adresse und Datum)!
        </Typography>

        <Link href={'/a/tag/Das%20Wort%20zum%20Bild'}>
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
  ${TeaserLead},
  ${TeaserMetadata} {
    display: none;
  }

  ${OnlineReportsBaseTeaserStyled} {
    grid-template-rows: auto auto auto auto auto auto;
  }

  ${TeaserTitle} {
    display: block;
    opacity: 0;
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 10px;
    margin: 0;
    line-height: 1.2em;
    transition: opacity 500ms ease;

    background: rgba(0, 0, 0, 0.7);
    font-size: 14px;
    font-weight: 300;
    color: #fff;
  }

  ${TeaserWrapper}:hover {
    ${TeaserTitle} {
      opacity: 1;
    }
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

  ${SliderBallContainer} {
    margin-top: ${({theme}) => theme.spacing(1)};
  }

  ${SliderArrow} {
    display: block;
  }
`
