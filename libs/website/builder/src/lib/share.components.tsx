import { BuilderShareProps } from './share.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Share = (props: BuilderShareProps) => {
  const { Share } = useWebsiteBuilder();

  return <Share {...props} />;
};
