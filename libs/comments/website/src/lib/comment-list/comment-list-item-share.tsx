import { Share, ShareOptions, ShareWrapper } from '@wepublish/ui';
import { BuilderCommentListItemShareProps } from '@wepublish/website/builder';

/**
 * @deprecated Use `ShareWrapper` from `@wepublish/ui` instead.
 */
export const CommentListItemShareWrapper = ShareWrapper;

/**
 * @deprecated Use `ShareOptions` from `@wepublish/ui` instead.
 */
export const CommentListItemShareOptions = ShareOptions;

/**
 * @deprecated Use the `Share` component from `@wepublish/ui` (registered as
 * `Share` in the website builder) instead.
 */
export const CommentListItemShare = ({
  forceNonSystemShare,
  ...props
}: BuilderCommentListItemShareProps) => (
  <Share
    {...props}
    overrideNavigatorShare={forceNonSystemShare}
  />
);
