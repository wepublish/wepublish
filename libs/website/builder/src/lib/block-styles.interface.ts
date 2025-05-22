import {
  BuilderBreakBlockProps,
  BuilderImageGalleryBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps,
  BuilderTeaserProps
} from './blocks.interface'

export type BuilderBlockStyleProps = {
  ImageSlider: BuilderImageGalleryBlockProps
  TeaserSlider: BuilderTeaserListBlockProps | BuilderTeaserGridBlockProps
  AlternatingTeaserGrid: BuilderTeaserGridBlockProps
  AlternatingTeaserList: BuilderTeaserListBlockProps
  AlternatingTeaser: BuilderTeaserProps
  FocusTeaser: BuilderTeaserListBlockProps
  Banner: BuilderBreakBlockProps
  ContextBox: BuilderBreakBlockProps
}
