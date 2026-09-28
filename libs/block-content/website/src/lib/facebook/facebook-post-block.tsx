import styled from '@emotion/styled';
import {
  FullBlockFragment,
  FullFacebookPostBlockFragment,
} from '@wepublish/website/api';
import { BuilderFacebookPostBlockProps } from '@wepublish/website/builder';

export const isFacebookPostBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
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
