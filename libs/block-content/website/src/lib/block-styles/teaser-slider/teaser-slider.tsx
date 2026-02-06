import 'keen-slider/keen-slider.min.css';

import { useMediaQuery, useTheme } from '@mui/material';
import styled from '@emotion/styled';
import { useKeenSlider } from 'keen-slider/react';
import { allPass, anyPass } from 'ramda';
import { useState } from 'react';

import {
  BlockContent,
  TeaserGridBlock,
  TeaserListBlock,
  TeaserSlotsBlock,
} from '@wepublish/website/api';
import { hasBlockStyle } from '../../has-blockstyle';
import {
  alignmentForTeaserBlock,
  isFilledTeaser,
  isTeaserGridBlock,
} from '../../teaser/teaser-grid-block';
import { isTeaserListBlock } from '../../teaser/teaser-list-block';
import {
  BuilderBlockStyleProps,
  BuilderSlidesPerView,
  BuilderTeaserListBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdArrowBackIos, MdArrowForwardIos } from 'react-icons/md';
import { isTeaserSlotsBlock } from '../../teaser/teaser-slots-block';

export const SliderWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const SliderInnerContainer = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};
`;

export const SlidesContainer = styled('div')`
  position: relative;
`;

export const SliderTitle = styled('div')`
  text-align: center;
`;

export const SliderBallContainer = styled('div')`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(1)};
  position: relative;
`;

export const SliderBall = styled('button')`
  appearance: none;
  border: none;
  width: ${({ theme }) => theme.spacing(2)};
  height: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.grey[200]};
  color: ${({ theme }) => theme.palette.primary.main};
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  padding: 0;

  :focus {
    outline: none;
  }
`;

export const SliderBallFill = styled('span')`
  display: block;
  background-color: currentColor;
  height: 100%;
`;

export const SliderArrow = styled('button')`
  appearance: none;
  border: none;
  background: transparent;
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 2;
  cursor: pointer;
  display: none;

  &:last-of-type {
    right: 0;
    left: initial;
  }

  &:hover {
    color: #000;
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

export const useSlidesPerView = ({
  xs = 1.4,
  sm = 2,
  md = 2.2,
  lg = 2.3,
  xl = 2.8,
}: BuilderSlidesPerView = {}) => {
  const theme = useTheme();

  const smQuery = useMediaQuery(theme.breakpoints.up('sm'), {
    ssrMatchMedia: () => ({ matches: false }),
  });

  const mdQuery = useMediaQuery(theme.breakpoints.up('md'), {
    ssrMatchMedia: () => ({ matches: false }),
  });

  const lgQuery = useMediaQuery(theme.breakpoints.up('lg'), {
    ssrMatchMedia: () => ({ matches: false }),
  });

  const xlQuery = useMediaQuery(theme.breakpoints.up('xl'), {
    ssrMatchMedia: () => ({ matches: false }),
  });

  if (xlQuery) {
    return xl;
  }

  if (lgQuery) {
    return lg;
  }

  if (mdQuery) {
    return md;
  }

  if (smQuery) {
    return sm;
  }

  return xs;
};

export const useSlidesPadding = () => {
  const theme = useTheme();

  const sm = useMediaQuery(theme.breakpoints.up('sm'), {
    ssrMatchMedia: () => ({ matches: false }),
  });

  if (sm) {
    return 32;
  }

  return 16;
};

export const TeaserSlider = ({
  blockStyle,
  className,
  teasers,
  slidesPerViewConfig = {},
  ...props
}: BuilderBlockStyleProps['TeaserSlider']) => {
  const {
    elements: { H5 },
    blocks: { Teaser },
  } = useWebsiteBuilder();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const filledTeasers = teasers.filter(isFilledTeaser);

  const slidesPerView = useSlidesPerView(slidesPerViewConfig);
  const slidePadding = useSlidesPadding();
  const [ref, sliderRef] = useKeenSlider({
    mode: 'free-snap',
    loop: true,
    slides: {
      origin: 'center',
      perView: slidesPerView,
      spacing: slidePadding,
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  return (
    !!filledTeasers.length && (
      <SliderWrapper className={className}>
        {(props as BuilderTeaserListBlockProps).title && (
          <SliderTitle>
            <H5 component={'h1'}>
              {(props as BuilderTeaserListBlockProps).title}
            </H5>
          </SliderTitle>
        )}

        <SliderInnerContainer>
          <SlidesContainer
            ref={ref}
            className="keen-slider"
          >
            {filledTeasers.map((teaser, index) => (
              <div
                key={index}
                className="keen-slider__slide"
              >
                <Teaser
                  index={index}
                  teaser={teaser}
                  blockStyle={blockStyle}
                  alignment={alignmentForTeaserBlock(0, 3)}
                />
              </div>
            ))}
          </SlidesContainer>

          {loaded && sliderRef.current && (
            <SliderBallContainer>
              {[
                ...Array(
                  sliderRef.current?.track.details?.slides.length
                ).keys(),
              ].map(idx => (
                <SliderBall
                  key={idx}
                  onClick={() => sliderRef.current?.moveToIdx(idx)}
                  aria-label={`Slide ${idx + 1}`}
                >
                  {currentSlide === idx && <SliderBallFill />}
                </SliderBall>
              ))}

              <SliderArrow
                onClick={() => sliderRef.current?.prev()}
                aria-label="Previous slide"
              >
                <MdArrowBackIos size={22} />
              </SliderArrow>

              <SliderArrow
                onClick={() => sliderRef.current?.next()}
                aria-label="Next slide"
              >
                <MdArrowForwardIos size={22} />
              </SliderArrow>
            </SliderBallContainer>
          )}
        </SliderInnerContainer>
      </SliderWrapper>
    )
  );
};

export const isTeaserSliderBlockStyle = (
  block: BlockContent
): block is TeaserGridBlock | TeaserListBlock | TeaserSlotsBlock =>
  allPass([
    hasBlockStyle('Slider'),
    anyPass([isTeaserGridBlock, isTeaserListBlock, isTeaserSlotsBlock]),
  ])(block);
