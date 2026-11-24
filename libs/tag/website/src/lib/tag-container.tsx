import { useQuery } from '@apollo/client/react';
import { PageContainer } from '@wepublish/page/website';
import {
  ArticleListDocument,
  TagDocument,
  TagQueryVariables,
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
  const tagData = useQuery(TagDocument, {
    variables: {
      tag,
      type,
    },
  });

  const pageId = tagData.data?.tag?.pageId;

  const articles = useQuery(ArticleListDocument, {
    skip: !tagData.data?.tag?.id || !!pageId,
    variables: {
      ...variables,
      filter: {
        tags: tagData.data?.tag ? [tagData.data.tag.id] : [],
      },
    },
  });

  // An editor picked a page to show instead of the tag's article list.
  if (pageId) {
    return (
      <PageContainer
        id={pageId}
        className={className}
      />
    );
  }

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
