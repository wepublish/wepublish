import { BuilderBannerProps } from './banner.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Banner = (props: BuilderBannerProps) => {
  const { Banner } = useWebsiteBuilder();

  return <Banner {...props} />;
};
