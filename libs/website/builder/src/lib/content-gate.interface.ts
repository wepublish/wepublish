import { FullContentGateFragment } from '@wepublish/website/api';

export type BuilderContentGateProps = {
  className?: string;
  state: 'soft' | 'hard';
  texts?: Partial<{
    cta: string;
    login: string;
    continueReading: string;
  }>;
} & FullContentGateFragment;
