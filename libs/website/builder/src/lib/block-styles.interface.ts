import {
  BuilderBreakBlockProps,
  BuilderImageGalleryBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps,
  BuilderTeaserSlotsBlockProps,
} from './blocks.interface';
import { BuilderTeaserProps } from './teaser.interface';

export type BuilderBlockStyleProps = {
  ImageSlider: BuilderImageGalleryBlockProps;
  TeaserSlider:
    | BuilderTeaserListBlockProps
    | BuilderTeaserGridBlockProps
    | BuilderTeaserSlotsBlockProps;
  AlternatingTeaserGrid: BuilderTeaserGridBlockProps;
  AlternatingTeaserList: BuilderTeaserListBlockProps;
  AlternatingTeaserSlots: BuilderTeaserSlotsBlockProps;
  AlternatingTeaser: BuilderTeaserProps;
  FocusTeaser: BuilderTeaserListBlockProps | BuilderTeaserSlotsBlockProps;
  Banner: BuilderBreakBlockProps;
  ContextBox: BuilderBreakBlockProps;
};
