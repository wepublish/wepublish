import {styled} from '@mui/material'
import {
  BuilderAuthorLinksProps,
  BuilderAuthorProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'

declare module 'react' {
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto'
  }
}

export const AuthorWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export function Author({
  className,
  data,
  authorLinks: AuthorLinksComponent = AuthorLinks,
  loading,
  error
}: BuilderAuthorProps) {
  const {
    elements: {Image, H3, H5},
    blocks: {RichText}
  } = useWebsiteBuilder()

  if (!data?.author) {
    return null
  }

  return (
    <AuthorWrapper className={className}>
      <header>
        <H3 component="h1">{data.author.name}</H3>
        {data.author.jobTitle && <H5 component="aside">{data.author.jobTitle}</H5>}
      </header>

      {data.author.image && <Image image={data.author.image} fetchPriority="high" />}
      {!!data.author.links?.length && <AuthorLinksComponent links={data.author.links} />}

      <RichText richText={data.author.bio ?? []} />
    </AuthorWrapper>
  )
}

const AuthorLinksWrapper = styled('aside')`
  display: grid;
  grid-auto-columns: max-content;
  grid-auto-flow: column;
  gap: ${({theme}) => theme.spacing(2)};
`

export function AuthorLinks({links}: BuilderAuthorLinksProps) {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return (
    <AuthorLinksWrapper>
      {links.map((link, index) => (
        <Link key={index} href={link.url} target="__blank">
          {link.title}
        </Link>
      ))}
    </AuthorLinksWrapper>
  )
}
