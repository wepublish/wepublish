import {
  BuilderBreakBlockProps,
  BuilderImageGalleryBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps
} from './blocks.interface'

export type BuilderBlockStyleProps = {
  ImageSlider: BuilderImageGalleryBlockProps
  TeaserSlider: BuilderTeaserListBlockProps | BuilderTeaserGridBlockProps
  FocusTeaser: BuilderTeaserListBlockProps
  Banner: BuilderBreakBlockProps
  ContextBox: BuilderBreakBlockProps
}
