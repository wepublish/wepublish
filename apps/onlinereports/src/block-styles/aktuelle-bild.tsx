import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import {
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock,
  SliderArrow,
  SliderBallContainer,
  SliderInnerContainer,
  SliderTitle,
  TeaserAuthors,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserSlider,
  TeaserTitle,
  TeaserWrapper,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  TeaserGridBlock,
  TeaserListBlock,
} from '@wepublish/website/api';
import {
  BuilderTeaserListBlockProps,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import {
  OnlineReportsBaseTeaserStyled,
  OnlineReportsTeaserPreTitleWrapper,
  OnlineReportsTeaserTitleWrapper,
} from '../onlinereports-base-teaser';

export const IsAktuelleBildTeasers = (
  block: BlockContent
): block is TeaserGridBlock | TeaserListBlock =>
  allPass([hasBlockStyle('Aktuelle Bild'), isTeaserListBlock])(block);

export const AktuelleBild = ({
  teasers,
  blockStyle,
  className,
}: Pick<
  BuilderTeaserListBlockProps,
  'title' | 'teasers' | 'blockStyle' | 'className'
>) => {
  const filledTeasers = teasers.filter(isFilledTeaser);
  const numColumns = 1;

  const {
    elements: { H2 },
  } = useWebsiteBuilder();

  return (
    <AktuelleBildWrapper className={className}>
      <SideInfo>
        <H2>Das Wort zum Bild</H2>
        <Typography>
          Ein interessantes Bild geschossen?{' '}
          <Link
            href={
              'mailto:redaktion@onlinereports.ch?subject=Das Wort zum Build'
            }
          >
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
          slidesPerViewConfig={{
            xs: 1,
            sm: 1,
            md: 1,
            lg: 1,
            xl: 1,
          }}
        />
      </TeaserSliderWrapper>
    </AktuelleBildWrapper>
  );
};

const SideInfo = styled(Box)``;
const TeaserSliderWrapper = styled(Box)``;

const AktuelleBildWrapper = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing(2.5)};

  ${TeaserSliderWrapper} {
    grid-column: span 3;

    ${({ theme }) => theme.breakpoints.up('md')} {
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
    opacity: 0;
    width: 100%;

    & > * {
      display: none;
    }

    & > ${TeaserAuthors} {
      width: 100%;
      display: block;
      color: #fff;
      font-size: ${({ theme }) => theme.typography.body2.fontSize};
      font-weight: 300;
      line-height: 1.2;
      width: 100%;
    }
  }

  ${OnlineReportsBaseTeaserStyled} {
    grid-template-rows: auto auto auto auto auto auto;
  }

  ${TeaserTitle} {
    display: block;
    opacity: 0;
    position: absolute;
    bottom: 25px;
    width: 100%;
    padding: 4px 10px 2px 10px;
    margin: 0;
    line-height: 1.2em;
    transition: opacity 500ms ease;

    background: rgba(0, 0, 0, 0.7);
    font-size: ${({ theme }) => theme.typography.body2.fontSize};
    font-weight: 300;
    color: #fff;

    /* target webkit browsers only */
    @supports (background: -webkit-canvas(squares)) {
      bottom: 24px;
    }
  }

  ${TeaserWrapper} {
    ${TeaserTitle} {
      opacity: 1;
      font-weight: 600;
    }
    ${TeaserMetadata} {
      opacity: 1;
      padding: 2px 10px 4px 10px;
      background: rgba(0, 0, 0, 0.7);
      transition: opacity 500ms ease;
      position: absolute;
      bottom: 2px;
      width: 100%;

      &::before {
        content: ' ';
        position: absolute;
        left: 10px;
        height: 100%;
        top: -2px;
        width: 30px;
        font-size: ${({ theme }) => theme.typography.body2.fontSize};
        font-weight: 300;
        color: ${({ theme }) => theme.palette.common.white};
        background-color: transparent;
        display: block;
        z-index: 20;
      }
    }

    ${({ theme }) => theme.breakpoints.up('sm')} {
      ${TeaserTitle} {
        opacity: 0;
      }
      ${TeaserMetadata} {
        opacity: 0;
      }

      &:hover {
        ${TeaserTitle} {
          opacity: 1;
        }
        ${TeaserMetadata} {
          opacity: 1;
        }
      }
    }
  }

  ${SliderInnerContainer} {
    gap: ${({ theme }) => theme.spacing(2)};
  }

  ${SideInfo} {
    grid-column: span 1;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1)};

    ${({ theme }) => theme.breakpoints.down('md')} {
      grid-column: span 3;
    }
  }

  ${SliderBallContainer} {
    margin-top: ${({ theme }) => theme.spacing(1)};
  }

  ${SliderArrow} {
    display: block;
  }
`;
