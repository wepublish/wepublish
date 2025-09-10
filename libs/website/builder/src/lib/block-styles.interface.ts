import {
  BuilderBreakBlockProps,
  BuilderImageGalleryBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps
} from './blocks.interface'

export type BuilderSlidesPerView = Partial<{
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
}>

export type BuilderSliderConfig = {
  slidesPerViewConfig: BuilderSlidesPerView
}

export type BuilderBlockStyleProps = {
  ImageSlider: BuilderImageGalleryBlockProps & BuilderSliderConfig
  TeaserSlider: (BuilderTeaserListBlockProps | BuilderTeaserGridBlockProps) & BuilderSliderConfig
  FocusTeaser: BuilderTeaserListBlockProps
  Banner: BuilderBreakBlockProps
  ContextBox: BuilderBreakBlockProps
}
