import { BuilderTextToIconProps } from './text-to-icon.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const TextToIcon = (props: BuilderTextToIconProps) => {
  const { TextToIcon } = useWebsiteBuilder();

  return <TextToIcon {...props} />;
};
