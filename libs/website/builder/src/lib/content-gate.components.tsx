import { BuilderContentGateProps } from './content-gate.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const ContentGate = (props: BuilderContentGateProps) => {
  const { ContentGate } = useWebsiteBuilder();

  return <ContentGate {...props} />;
};
