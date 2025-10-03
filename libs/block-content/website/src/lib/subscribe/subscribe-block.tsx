import {
  BlockContent,
  SubscribeBlock as SubscribeBlockType,
} from '@wepublish/website/api';
import {
  BuilderSubscribeBlockProps,
  Subscribe,
} from '@wepublish/website/builder';

export const isSubscribeBlock = (
  block: Pick<BlockContent, '__typename'>
): block is SubscribeBlockType => block.__typename === 'SubscribeBlock';

export const SubscribeBlock = ({
  className,
  memberPlanIds,
  memberPlans,
  fields,
}: BuilderSubscribeBlockProps) => {
  return <Subscribe fields={fields} />;
};
