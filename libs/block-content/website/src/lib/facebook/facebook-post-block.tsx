import styled from '@emotion/styled';
import {
  BlockContent,
  FullFacebookPostBlockFragment,
} from '@wepublish/website/api';
import { BuilderFacebookPostBlockProps } from '@wepublish/website/builder';

export const isFacebookPostBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FullFacebookPostBlockFragment =>
  block.__typename === 'FacebookPostBlock';

export const FacebookPostBlockWrapper = styled('div')``;

export function FacebookPostBlock({
  userID,
  postID,
  className,
}: BuilderFacebookPostBlockProps) {
  return (
    <FacebookPostBlockWrapper className={className}></FacebookPostBlockWrapper>
  );
}
