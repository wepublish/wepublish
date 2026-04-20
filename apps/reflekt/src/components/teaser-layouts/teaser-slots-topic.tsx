import styled from '@emotion/styled';
import { Theme, Typography, useMediaQuery } from '@mui/material';
import {
  alignmentForTeaserBlock,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserSlotsBlock,
  SliderArrow,
  SliderBall,
  SliderBallContainer,
  SliderWrapper,
  TeaserSlider,
  TeaserSlotsBlockWrapper as TeaserSlotsBlockWrapperDefault,
} from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderTeaserListBlockProps,
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Maybe } from 'graphql/jsutils/Maybe';
import { allPass, anyPass } from 'ramda';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import { TeaserWrapper } from '../teasers/reflekt-teaser';

export const isTeaserSlotsTopic = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderTeaserSlotsBlockProps =>
  allPass([
    isTeaserSlotsBlock,
    anyPass([
      hasBlockStyle(ReflektBlockType.TeaserRecherchen),
      hasBlockStyle(ReflektBlockType.TeaserNews),
    ]),
  ])(block);

export const TeaserSlotsTopicWrapper = styled(TeaserSlotsBlockWrapperDefault)<{
  blockStyle?: string;
}>`
  ${SliderWrapper} ${TeaserWrapper} {
    ${({ theme }) => theme.breakpoints.down('md')} {
      width: 100%;
    }
  }

  .keen-slider__slide {
    ${({ theme }) => theme.breakpoints.down('md')} {
      width: calc(100vw - 64px) !important;
      min-width: calc(100vw - 64px) !important;
      max-width: calc(100vw - 64px) !important;
    }
  }

  ${SliderBallContainer} {
    margin-left: -${({ theme }) => theme.spacing(6)};
    margin-right: -${({ theme }) => theme.spacing(6)};
    margin-top: -50%;
    pointer-events: none;

    ${({ theme }) => theme.breakpoints.up('md')} {
      display: ${({ blockStyle }) =>
        blockStyle === ReflektBlockType.TeaserNews ? 'none' : 'block'};
    }

    ${SliderArrow} {
      display: block;
      pointer-events: all;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='23.75' fill='%23fafafa' fill-opacity='.8' stroke='%23000' stroke-width='.5' transform='rotate(-180 24 24)'/%3E%3Cpath stroke='%23000' stroke-linecap='square' stroke-width='3' d='m28 34-9.276-9.276L28 15.45'/%3E%3C/svg%3E");

      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      width: 35px;
      height: 35px;

      &:hover {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='23.75' fill='%23d8d8d8' fill-opacity='.8' stroke='%23000' stroke-width='.5' transform='rotate(-180 24 24)'/%3E%3Cpath stroke='%23000' stroke-linecap='square' stroke-width='3' d='m28 34-9.276-9.276L28 15.45'/%3E%3C/svg%3E");
      }

      & + ${SliderArrow} {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='23.75' fill='%23fafafa' fill-opacity='.8' stroke='%23000' stroke-width='.5' transform='rotate(-180 24 24)'/%3E%3Cpath stroke='%23000' stroke-linecap='square' stroke-width='3' d='m20 34 9.276-9.276L20 15.45'/%3E%3C/svg%3E");

        &:hover {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='23.75' fill='%23d8d8d8' fill-opacity='.8' stroke='%23000' stroke-width='.5' transform='rotate(-180 24 24)'/%3E%3Cpath stroke='%23000' stroke-linecap='square' stroke-width='3' d='m20 34 9.276-9.276L20 15.45'/%3E%3C/svg%3E");
        }
      }
    }

      svg {
        visibility: hidden;
      }
    }

    ${SliderBall} {
      display: none;
    }
  }
`;

export const blockStyleByIndex = (
  index: number,
  count: number,
  blockStyle?: Maybe<string>
): ReflektBlockType | undefined => {
  return index < count - 1 ?
      (blockStyle as ReflektBlockType)
    : ReflektBlockType.TeaserMoreAbout;
};

export const TeaserSlotsTopic = ({
  blockStyle,
  className,
  teasers,
  title,
}: Pick<
  BuilderTeaserListBlockProps,
  'title' | 'teasers' | 'blockStyle' | 'className'
>) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  const filledTeasers = teasers.filter(isFilledTeaser);
  const numColumns = 1;

  return (
    !!filledTeasers.length && (
      <TeaserSlotsTopicWrapper
        className={className}
        blockStyle={blockStyle ?? undefined}
      >
        <Typography variant={'teaserSlotsTitle'}>{title}</Typography>
        <TeaserSlider
          teasers={filledTeasers.filter(
            teaser =>
              teaser?.__typename === 'ArticleTeaser' ||
              teaser?.__typename === 'CustomTeaser'
          )}
          blockStyle={blockStyle}
          numColumns={numColumns}
          slidesPerViewConfig={{
            xs: 'auto',
            sm: 'auto',
            md: 3,
            lg: 3,
            xl: 3,
          }}
          dragDisabled={
            blockStyle === ReflektBlockType.TeaserNews ? isDesktop : false
          }
          detailsChanged={slider => {
            slider.slides.forEach((slide: any) => {
              slide.style.opacity = '1';
              slide.style.visibility = 'visible';
            });
          }}
        />
        <Teaser
          key={filledTeasers.length - 1}
          index={filledTeasers.length - 1}
          teaser={filledTeasers[filledTeasers.length - 1]}
          alignment={alignmentForTeaserBlock(filledTeasers.length - 1, 3)}
          blockStyle={blockStyleByIndex(
            filledTeasers.length - 1,
            filledTeasers.length,
            blockStyle
          )}
        />
      </TeaserSlotsTopicWrapper>
    )
  );
};
