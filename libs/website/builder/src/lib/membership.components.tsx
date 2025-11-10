import { BuilderSubscribeProps } from './membership.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Subscribe = (props: BuilderSubscribeProps) => {
  const { Subscribe } = useWebsiteBuilder();

  return <Subscribe {...props} />;
};
