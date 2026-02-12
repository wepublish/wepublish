import {
  BuilderBreakBlockProps, // IGNORE
  BuilderImageGalleryBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps,
  BuilderTeaserSlotsBlockProps,
} from './blocks.interface';
import { BuilderTeaserProps } from './teaser.interface';

export type BuilderSlidesPerView = Partial<{
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}>;

export type BuilderSliderConfig = {
  slidesPerViewConfig?: BuilderSlidesPerView;
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
