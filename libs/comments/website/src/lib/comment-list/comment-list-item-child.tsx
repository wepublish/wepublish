import {
  BuilderCommentListItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const CommentListItemChild = ({
  ratingSystem,
  ...props
}: BuilderCommentListItemProps) => {
  const { CommentListItem } = useWebsiteBuilder();

  return (
    <CommentListItem
      {...props}
      ratingSystem={{
        ...ratingSystem,
        answers: [],
      }}
    />
  );
};
