import { FullPeerFragment } from '@wepublish/website/api';
import { CSSProperties } from 'react';

export type BuilderPeerProps = FullPeerFragment & {
  originUrl?: string;
  className?: string;
  style?: CSSProperties;
};
