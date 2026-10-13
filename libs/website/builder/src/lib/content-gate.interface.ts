import { FullContentGateFragment } from '@wepublish/website/api';

export type BuilderContentGateProps = {
  className?: string;
  /**
   * soft: dismissible, the article can be read after dismissing it.
   * hard: the reader only gets the preview blocks.
   */
  state: 'soft' | 'hard';
  texts?: Partial<{
    cta: string;
    login: string;
    continueReading: string;
  }>;
} & FullContentGateFragment;
