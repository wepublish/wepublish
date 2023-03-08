import {Container, styled} from '@mui/material'
import {BuilderFooterProps, useWebsiteBuilder} from '@wepublish/website-builder'
import {NavigationQuery} from '@wepublish/website/api'
import {TupleToUnion} from 'type-fest'

const FooterWrapper = styled('footer')`
  align-self: flex-end;
  color: ${({theme}) => theme.palette.secondary.contrastText};
  background-color: ${({theme}) => theme.palette.secondary.main};
  padding: ${({theme}) => theme.spacing(2)};
`

const FooterInnerWrapper = styled(Container)`
  display: grid;
  grid-template-columns: 200px auto;
  justify-content: space-between;
  align-items: center;
`

const FooterLinks = styled('nav')`
  display: grid;
  grid-auto-flow: column;
  gap: ${({theme}) => theme.spacing(4)};
`

export type FooterProps = BuilderFooterProps

const navigationLinkToUrl = <T extends NonNullable<NavigationQuery['navigation']>>(
  link: TupleToUnion<T['links']>
): string | undefined => {
  switch (link.__typename) {
    case 'ArticleNavigationLink':
      return link.article?.url
    case 'PageNavigationLink':
      return link.page?.url
    case 'ExternalNavigationLink':
      return link.url
  }
}

export function Footer({data, loading, error, children}: FooterProps) {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return (
    <FooterWrapper>
      <FooterInnerWrapper>
        {children}

        <FooterLinks>
          {data?.navigation?.links.map((link, index) => {
            const url = navigationLinkToUrl(link)

            return (
              <Link href={url} key={index} color="inherit">
                {link.label}
              </Link>
            )
          })}
        </FooterLinks>
      </FooterInnerWrapper>
    </FooterWrapper>
  )
}
