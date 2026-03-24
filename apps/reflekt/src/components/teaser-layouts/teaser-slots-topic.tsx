import styled from '@emotion/styled';
import { Theme, Typography, useMediaQuery } from '@mui/material';
import {
  alignmentForTeaserBlock,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserSlotsBlock,
  TeaserSlider,
  TeaserSlotsBlockWrapper as TeaserSlotsBlockWrapperDefault,
} from '@wepublish/block-content/website';
import {
  SliderBallContainer,
  SliderWrapper,
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

export const TeaserSlotsTopicWrapper = styled(TeaserSlotsBlockWrapperDefault)`
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
    display: none;
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
      <TeaserSlotsTopicWrapper className={className}>
        <Typography variant={'teaserSlotsTitle'}>{title}</Typography>
        <TeaserSlider
          teasers={filledTeasers.filter(
            teaser => teaser?.__typename === 'ArticleTeaser'
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
          dragDisabled={isDesktop}
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
