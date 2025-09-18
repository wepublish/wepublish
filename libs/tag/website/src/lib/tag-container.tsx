import {TagQueryVariables, useArticleListQuery, useTagQuery} from '@wepublish/website/api'
import {BuilderArticleListProps, BuilderContainerProps, Tag} from '@wepublish/website/builder'

export type TagContainerProps = TagQueryVariables &
  BuilderContainerProps &
  Pick<BuilderArticleListProps, 'variables' | 'onVariablesChange'>

export function TagContainer({
  tag,
  type,
  className,
  variables,
  onVariablesChange
}: TagContainerProps) {
  const tags = useTagQuery({
    variables: {
      tag,
      type
    }
  })

  const articles = useArticleListQuery({
    skip: !tags.data?.tags?.nodes[0].id,
    variables: {
      ...variables,
      filter: {
        tags: tags.data?.tags?.nodes[0] ? [tags.data.tags.nodes[0].id] : []
      }
    }
  })

  return (
    <Tag
      className={className}
      tags={tags}
      articles={articles}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  )
}
