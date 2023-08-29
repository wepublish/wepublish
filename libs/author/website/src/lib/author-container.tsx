import {useAuthorQuery} from '@wepublish/website/api'
import {
  BuilderAuthorProps,
  BuilderContainerProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'

type IdOrSlug = {id: string; slug?: never} | {id?: never; slug: string}

export type AuthorContainerProps = IdOrSlug &
  Pick<BuilderAuthorProps, 'authorLinks'> &
  BuilderContainerProps

export function AuthorContainer({id, slug, authorLinks, className}: AuthorContainerProps) {
  const {Author} = useWebsiteBuilder()
  const {data, loading, error} = useAuthorQuery({
    variables: {
      id,
      slug
    }
  })

  return (
    <Author
      data={data}
      loading={loading}
      error={error}
      className={className}
      authorLinks={authorLinks}
    />
  )
}
