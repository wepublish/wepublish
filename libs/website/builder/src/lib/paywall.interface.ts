import { FullPaywallFragment } from '@wepublish/website/api';
import { CSSProperties } from 'react';

export type BuilderPaywallProps = {
  className?: string;
  style?: CSSProperties;
  hideContent?: boolean;
} & FullPaywallFragment;
