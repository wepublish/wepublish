import { BuilderPaywallProps } from './paywall.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Paywall = (props: BuilderPaywallProps) => {
  const { Paywall } = useWebsiteBuilder();

  return <Paywall {...props} />;
};
