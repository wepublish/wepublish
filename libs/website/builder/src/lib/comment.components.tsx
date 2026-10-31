import {
  BuilderCommentEditorProps,
  BuilderCommentListItemProps,
  BuilderCommentListProps,
  BuilderCommentProps,
  BuilderCommentRatingsProps,
} from './comment.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Comment = (props: BuilderCommentProps) => {
  const { Comment } = useWebsiteBuilder();

  return <Comment {...props} />;
};

export const CommentList = (props: BuilderCommentListProps) => {
  const { CommentList } = useWebsiteBuilder();

  return <CommentList {...props} />;
};

export const CommentListItem = (props: BuilderCommentListItemProps) => {
  const { CommentListItem } = useWebsiteBuilder();

  return <CommentListItem {...props} />;
};

export const CommentListItemChild = (props: BuilderCommentListItemProps) => {
  const { CommentListItemChild } = useWebsiteBuilder();

  return <CommentListItemChild {...props} />;
};

export const CommentEditor = (props: BuilderCommentEditorProps) => {
  const { CommentEditor } = useWebsiteBuilder();

  return <CommentEditor {...props} />;
};

export const CommentRatings = (props: BuilderCommentRatingsProps) => {
  const { CommentRatings } = useWebsiteBuilder();

  return <CommentRatings {...props} />;
};
