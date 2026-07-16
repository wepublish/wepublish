import styled from '@emotion/styled';
import {
  hasBlockStyle,
  ImageSlider,
  isImageGalleryBlock,
  SliderArrow,
  SliderBallContainer,
  SliderInnerContainer,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FullImageGalleryBlockFragment,
} from '@wepublish/website/api';
import { BuilderBlockStyleProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockStyles } from './block-styles/reflekt-block-styles';
import { reflektSliderControls } from './reflekt-slider-controls';

export const isImageSliderSlimBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is FullImageGalleryBlockFragment =>
  allPass([hasBlockStyle(ReflektBlockStyles.SliderSlim), isImageGalleryBlock])(
    block
  );

const StyledImageSlider = styled(ImageSlider)`
  ${SliderInnerContainer} {
    gap: 0;
    position: relative;
  }

  .keen-slider__slide {
    ${({ theme }) => theme.breakpoints.down('md')} {
      width: calc(100vw - 64px) !important;
      min-width: calc(100vw - 64px) !important;
      max-width: calc(100vw - 64px) !important;
    }

    img {
      width: 100%;
      height: auto;
      aspect-ratio: 365/528;
      object-fit: cover;
    }

    figcaption {
      display: none;
    }
  }

  ${({ theme }) => reflektSliderControls(theme)}

  ${SliderBallContainer} {
    position: static;
    margin: 0;

    ${SliderArrow} {
      left: -${({ theme }) => theme.spacing(6)};

      &:last-of-type {
        right: -${({ theme }) => theme.spacing(6)};
        left: initial;
      }
    }

    ${({ theme }) => theme.breakpoints.down('md')} {
      display: none;
    }
  }
`;

const slidesPerViewConfig = {
  xs: 'auto',
  sm: 'auto',
  md: 3,
  lg: 3,
  xl: 3,
} as const;

export const ReflektImageSlider = (
  props: BuilderBlockStyleProps['ImageSlider']
) => (
  <StyledImageSlider
    {...props}
    slidesPerViewConfig={slidesPerViewConfig}
  />
);

export const ReflektImageSliderSlim = (
  props: BuilderBlockStyleProps['ImageSlider']
) => (
  <StyledImageSlider
    {...props}
    slidesPerViewConfig={slidesPerViewConfig}
    slideGap={16}
  />
);
