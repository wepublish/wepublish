import {css, styled} from '@mui/material'
import {TextToIcon} from '@wepublish/ui'
import {BuilderAuthorLinksProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const AuthorLinksWrapper = styled('aside')`
  display: grid;
  grid-auto-columns: max-content;
  grid-auto-flow: column;
  align-items: center;
  gap: ${({theme}) => theme.spacing(2)};
`

const linkStyles = css`
  display: grid;
`

export function AuthorLinks({links, className}: BuilderAuthorLinksProps) {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return (
    <AuthorLinksWrapper className={className}>
      {links.map((link, index) => (
        <Link key={index} href={link.url} target="__blank" title={link.title} css={linkStyles}>
          <TextToIcon title={link.title} size={22} />
        </Link>
      ))}
    </AuthorLinksWrapper>
  )
}
