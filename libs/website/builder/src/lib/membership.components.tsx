import {
  BuilderSubscribeProps,
  BuilderUpgradeProps,
} from './membership.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Subscribe = (props: BuilderSubscribeProps) => {
  const { Subscribe } = useWebsiteBuilder();

  return <Subscribe {...props} />;
};

export const Upgrade = (props: BuilderUpgradeProps) => {
  const { Upgrade } = useWebsiteBuilder();

  return <Upgrade {...props} />;
};
