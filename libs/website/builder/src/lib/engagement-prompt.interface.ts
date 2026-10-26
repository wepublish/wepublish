import {
  FullEngagementActionFragment,
  FullEngagementPromptFragment,
} from '@wepublish/website/api';

export type BuilderEngagementPromptProps = {
  className?: string;
  /**
   * The stage's placement says how it shows: a `MODAL` over the article,
   * `INLINE` in it, or the `CUTOFF` after the preview blocks of a restricted
   * article (a hard stage).
   */
  prompt: FullEngagementPromptFragment;
  /** Undefined when the prompt can not be dismissed. */
  onDismiss?: () => void;
  /** Called before the action's link is followed, e.g. for tracking. */
  onAction?: (action: FullEngagementActionFragment) => void;
};
