import { FullPeerFragment } from '@wepublish/website/api';

export type BuilderPeerProps = FullPeerFragment & {
  originUrl?: string;
  className?: string;
};
