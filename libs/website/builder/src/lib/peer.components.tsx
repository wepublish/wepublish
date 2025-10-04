import { BuilderPeerProps } from './peer.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const PeerInformation = (props: BuilderPeerProps) => {
  const { PeerInformation } = useWebsiteBuilder();

  return <PeerInformation {...props} />;
};
