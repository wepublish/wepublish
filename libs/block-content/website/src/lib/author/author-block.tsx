import styled from '@emotion/styled';
import {
  FullAuthorBlockFragment,
  FullBlockFragment,
} from '@wepublish/website/api';
import {
  AuthorChip,
  BuilderAuthorBlockProps,
} from '@wepublish/website/builder';

export const isAuthorBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullAuthorBlockFragment => block.__typename === 'AuthorBlock';

export const AuthorBlockWrapper = styled('div')``;

export const AuthorBlock = ({
  authorObj,
  className,
}: BuilderAuthorBlockProps) => {
  if (!authorObj) {
    return null;
  }

  return (
    <AuthorBlockWrapper className={className}>
      <AuthorChip author={authorObj} />
    </AuthorBlockWrapper>
  );
};
