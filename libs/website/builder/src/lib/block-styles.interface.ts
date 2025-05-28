import {
  BuilderBreakBlockProps,
  BuilderImageGalleryBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps
} from './blocks.interface'
import {BuilderTeaserProps} from './teaser.interface'

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
