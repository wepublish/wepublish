import {styled} from '@mui/material'
import {BuilderAuthorLinksProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {FaInstagram, FaLinkedin, FaTwitter} from 'react-icons/fa6'
import {MdContactMail, MdFacebook, MdMail, MdWeb} from 'react-icons/md'

export const AuthorLinksWrapper = styled('aside')`
  display: grid;
  grid-auto-columns: max-content;
  grid-auto-flow: column;
  gap: ${({theme}) => theme.spacing(2)};
`

export const AuthorLinkIcon = ({title}: {title: string}) => {
  if (['twitter', 'x'].includes(title.toLowerCase())) {
    return <FaTwitter size={22} />
  }

  if (title.toLowerCase() === 'facebook') {
    return <MdFacebook size={22} />
  }

  if (title.toLowerCase() === 'instagram') {
    return <FaInstagram size={22} />
  }

  if (title.toLowerCase() === 'linkedin') {
    return <FaLinkedin size={22} />
  }

  if (['mail', 'e-mail', 'email'].includes(title.toLowerCase())) {
    return <MdMail size={22} />
  }

  if (['website', 'webseite'].includes(title.toLowerCase())) {
    return <MdWeb size={22} />
  }

  if (['presseausweis', 'trustj'].includes(title.toLowerCase())) {
    return <MdContactMail size={22} />
  }

  return title
}

export function AuthorLinks({links, className}: BuilderAuthorLinksProps) {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return (
    <AuthorLinksWrapper className={className}>
      {links.map((link, index) => (
        <Link key={index} href={link.url} target="__blank" title={link.title}>
          <AuthorLinkIcon title={link.title} />
        </Link>
      ))}
    </AuthorLinksWrapper>
  )
}
