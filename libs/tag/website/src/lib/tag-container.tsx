import {
  TagQueryVariables,
  useArticleListQuery,
  useTagQuery,
} from '@wepublish/website/api';
import {
  BuilderArticleListProps,
  BuilderContainerProps,
  Tag,
} from '@wepublish/website/builder';

export type TagContainerProps = TagQueryVariables &
  BuilderContainerProps &
  Pick<BuilderArticleListProps, 'variables' | 'onVariablesChange'>;

export function TagContainer({
  tag,
  type,
  className,
  variables,
  onVariablesChange,
}: TagContainerProps) {
  const tagData = useTagQuery({
    variables: {
      tag,
      type,
    },
  });

  const articles = useArticleListQuery({
    skip: !tagData.data?.tag?.id,
    variables: {
      ...variables,
      filter: {
        tags: tagData.data?.tag ? [tagData.data.tag.id] : [],
      },
    },
  });

  return (
    <Tag
      className={className}
      tag={tagData}
      articles={articles}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  );
}
