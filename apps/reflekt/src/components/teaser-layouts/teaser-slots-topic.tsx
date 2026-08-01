import styled from '@emotion/styled';
import { Theme, Typography, useMediaQuery } from '@mui/material';
import {
  alignmentForTeaserBlock,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserSlotsBlock,
  SliderBallContainer,
  SliderInnerContainer,
  SliderWrapper,
  TeaserSlider,
  TeaserSlotsBlockTeasers,
  TeaserSlotsBlockWrapper as TeaserSlotsBlockWrapperDefault,
} from '@wepublish/block-content/website';
import { BlockContent, FlexAlignment } from '@wepublish/website/api';
import {
  BuilderTeaserListBlockProps,
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Maybe } from 'graphql/jsutils/Maybe';
import { allPass, anyPass } from 'ramda';

import { anchorId } from '../anchor-id';
import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import { reflektSliderControls } from '../reflekt-slider-controls';
import { TeaserWrapper } from '../teasers/reflekt-teaser';

export const isTeaserSlotsTopic = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderTeaserSlotsBlockProps =>
  allPass([
    isTeaserSlotsBlock,
    anyPass([
      hasBlockStyle(ReflektBlockStyles.TeaserRecherchen),
      hasBlockStyle(ReflektBlockStyles.TeaserNews),
      hasBlockStyle(ReflektBlockStyles.TeaserRecherchenGrid),
      hasBlockStyle(ReflektBlockStyles.TeaserNewsGrid),
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

  ${SliderInnerContainer} {
    gap: 0;
  }

  .keen-slider__slide {
    ${({ theme }) => theme.breakpoints.down('md')} {
      width: calc(100vw - 64px) !important;
      min-width: calc(100vw - 64px) !important;
      max-width: calc(100vw - 64px) !important;
    }
  }

  ${TeaserWrapper} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      width: 100%;
    }
  }

  ${({ theme }) => reflektSliderControls(theme)}

  ${SliderBallContainer} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      display: ${({ blockStyle }) =>
        blockStyle === ReflektBlockStyles.TeaserNews ? 'none' : 'block'};
    }
  }
`;

export const blockStyleByIndex = (
  index: number,
  count: number,
  blockStyle?: Maybe<string>
): ReflektBlockStyles | undefined => {
  return index < count - 1 ?
      (blockStyle as ReflektBlockStyles)
    : ReflektBlockStyles.TeaserMoreAbout;
};

function endsWithAny(suffixes: string[], string: string) {
  for (const suffix of suffixes) {
    if (string.endsWith(suffix)) return true;
  }
  return false;
}

export const TeaserSlotsTopic = ({
  blockStyle,
  className,
  teasers,
  title,
  alignment,
}: Pick<
  BuilderTeaserListBlockProps,
  'title' | 'teasers' | 'blockStyle' | 'className'
> & { alignment?: FlexAlignment }) => {
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
        <Typography
          variant={'teaserSlotsTitle'}
          id={anchorId(title)}
        >
          {title}
        </Typography>
        {blockStyle && endsWithAny(['Recherchen', 'News'], blockStyle) && (
          <>
            <TeaserSlider
              teasers={filledTeasers.filter(
                teaser =>
                  teaser?.__typename === 'ArticleTeaser' ||
                  (teaser?.__typename === 'CustomTeaser' &&
                    teaser?.image !== null)
              )}
              blockStyle={blockStyle}
              numColumns={numColumns}
              origin={isDesktop ? 'auto' : 'center'}
              slidesPerViewConfig={{
                xs: 'auto',
                sm: 'auto',
                md: 3,
                lg: 3,
                xl: 3,
              }}
              dragDisabled={
                blockStyle === ReflektBlockStyles.TeaserNews ? isDesktop : false
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
          </>
        )}
        {blockStyle && endsWithAny(['Grid'], blockStyle) && (
          <TeaserSlotsBlockTeasers>
            {filledTeasers.map((teaser, index) => (
              <Teaser
                key={index}
                index={index}
                teaser={teaser}
                alignment={alignmentForTeaserBlock(index, 3)}
                blockStyle={
                  blockStyle.replace('Grid', '') as ReflektBlockStyles
                }
              />
            ))}
          </TeaserSlotsBlockTeasers>
        )}
      </TeaserSlotsTopicWrapper>
    )
  );
};
