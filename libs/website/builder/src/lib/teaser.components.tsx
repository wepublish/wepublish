import { BuilderTeaserProps } from './teaser.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const BaseTeaser = (props: BuilderTeaserProps) => {
  const {
    blocks: { BaseTeaser },
  } = useWebsiteBuilder();

  return <BaseTeaser {...props} />;
};

export const AlternatingTeaser = (props: BuilderTeaserProps) => {
  const {
    blockStyles: { AlternatingTeaser },
  } = useWebsiteBuilder();

  return <AlternatingTeaser {...props} />;
};

export const Teaser = (props: BuilderTeaserProps) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  return <Teaser {...props} />;
};
