import { BuilderBlockStyleProps } from './block-styles.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const ImageSlider = (props: BuilderBlockStyleProps['ImageSlider']) => {
  const {
    blockStyles: { ImageSlider },
  } = useWebsiteBuilder();

  return <ImageSlider {...props} />;
};

export const Lightbox = (props: BuilderBlockStyleProps['Lightbox']) => {
  const {
    blockStyles: { Lightbox },
  } = useWebsiteBuilder();

  return <Lightbox {...props} />;
};

export const TeaserSlider = (props: BuilderBlockStyleProps['TeaserSlider']) => {
  const {
    blockStyles: { TeaserSlider },
  } = useWebsiteBuilder();

  return <TeaserSlider {...props} />;
};

export const AlternatingTeaserGrid = (
  props: BuilderBlockStyleProps['AlternatingTeaserGrid']
) => {
  const {
    blockStyles: { AlternatingTeaserGrid },
  } = useWebsiteBuilder();

  return <AlternatingTeaserGrid {...props} />;
};

export const AlternatingTeaserList = (
  props: BuilderBlockStyleProps['AlternatingTeaserList']
) => {
  const {
    blockStyles: { AlternatingTeaserList },
  } = useWebsiteBuilder();

  return <AlternatingTeaserList {...props} />;
};

export const AlternatingTeaserSlots = (
  props: BuilderBlockStyleProps['AlternatingTeaserSlots']
) => {
  const {
    blockStyles: { AlternatingTeaserSlots },
  } = useWebsiteBuilder();

  return <AlternatingTeaserSlots {...props} />;
};

export const FocusTeaser = (props: BuilderBlockStyleProps['FocusTeaser']) => {
  const {
    blockStyles: { FocusTeaser },
  } = useWebsiteBuilder();

  return <FocusTeaser {...props} />;
};

export const ContextBox = (props: BuilderBlockStyleProps['ContextBox']) => {
  const {
    blockStyles: { ContextBox },
  } = useWebsiteBuilder();

  return <ContextBox {...props} />;
};

export const BannerBlockStyle = (props: BuilderBlockStyleProps['Banner']) => {
  const {
    blockStyles: { Banner },
  } = useWebsiteBuilder();

  return <Banner {...props} />;
};
