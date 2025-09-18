import { BuilderContentWrapperProps } from './content-wrapper.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const ContentWrapper = (props: BuilderContentWrapperProps) => {
  const { ContentWrapper } = useWebsiteBuilder();

  return <ContentWrapper {...props} />;
};
