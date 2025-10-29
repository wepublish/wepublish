import styled from '@emotion/styled';
import {
  BlockContent,
  CommentBlock as CommentBlockType,
} from '@wepublish/website/api';
import {
  BuilderCommentBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const isCommentBlock = (
  block: Pick<BlockContent, '__typename'>
): block is CommentBlockType => block.__typename === 'CommentBlock';

export const CommentBlockWrapper = styled('article')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
`;

export const CommentBlockActions = styled('div')``;

export const CommentBlock = ({
  className,
  comments,
}: BuilderCommentBlockProps) => {
  const { Comment: BuilderComment } = useWebsiteBuilder();

  return (
    <CommentBlockWrapper className={className}>
      {comments?.map(({ children, ...comment }) => (
        <BuilderComment
          key={comment.id}
          includeAnchor={false}
          {...comment}
        />
      ))}
    </CommentBlockWrapper>
  );
};
