import { FullPaywallFragment } from '@wepublish/website/api';

export type BuilderPaywallProps = {
  className?: string;
  hideContent?: boolean;
  texts?: Partial<{
    subscribe: string;
    login: string;
  }>;
} & FullPaywallFragment;
