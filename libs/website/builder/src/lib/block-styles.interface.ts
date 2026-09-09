import { Ref } from 'react';
import {
  BuilderBreakBlockProps, // IGNORE
  BuilderImageGalleryBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps,
  BuilderTeaserSlotsBlockProps,
} from './blocks.interface';
import { BuilderTeaserProps } from './teaser.interface';

export type BuilderSlidesPerView = Partial<{
  xs: number | 'auto';
  sm: number | 'auto';
  md: number | 'auto';
  lg: number | 'auto';
  xl: number | 'auto';
}>;

export type BuilderSlideGap = Partial<{
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}>;

export type BuilderSliderConfig = {
  className?: string;
  slidesPerViewConfig?: BuilderSlidesPerView;
  dragDisabled?: boolean;
  detailsChanged?: (slider: any) => void;
  slideGapConfig?: BuilderSlideGap;
  origin?: 'auto' | 'center' | number;
  loop?: boolean;
  refs?: { control?: Ref<HTMLDivElement | null> };
};

export type BuilderBlockStyleProps = {
  ImageSlider: BuilderImageGalleryBlockProps & BuilderSliderConfig;
  TeaserSlider: (
    | BuilderTeaserListBlockProps
    | BuilderTeaserGridBlockProps
    | BuilderTeaserSlotsBlockProps
  ) &
    BuilderSliderConfig;
  AlternatingTeaserGrid: BuilderTeaserGridBlockProps;
  AlternatingTeaserList: BuilderTeaserListBlockProps;
  AlternatingTeaserSlots: BuilderTeaserSlotsBlockProps;
  AlternatingTeaser: BuilderTeaserProps;
  FocusTeaser: BuilderTeaserListBlockProps | BuilderTeaserSlotsBlockProps;
  Banner: BuilderBreakBlockProps;
  ContextBox: BuilderBreakBlockProps;
};
