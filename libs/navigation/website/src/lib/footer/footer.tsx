import {Container, css, styled} from '@mui/material'
import {BuilderFooterProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {NavigationQuery} from '@wepublish/website/api'

const FooterWrapper = styled('footer')`
  align-self: flex-end;
  color: ${({theme}) => theme.palette.secondary.contrastText};
  background-color: ${({theme}) => theme.palette.secondary.main};
  padding: ${({theme}) => theme.spacing(2)};
`

const FooterInnerWrapper = styled(Container)`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
  justify-content: center;
  align-items: center;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      justify-content: space-between;
      grid-template-columns: auto auto;
    }
  `}
`

const FooterLinks = styled('nav')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: ${({theme}) => theme.spacing(4)};
  row-gap: ${({theme}) => theme.spacing(2)};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-template-columns: initial;
      grid-auto-flow: column;
      grid-auto-rows: min-content;
    }
  `}
`

export type FooterProps = BuilderFooterProps

const navigationLinkToUrl = <T extends NonNullable<NavigationQuery['navigation']>>(
  link: T['links'][number]
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

export function Footer({className, data, loading, error, children}: FooterProps) {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return (
    <FooterWrapper className={className}>
      <FooterInnerWrapper>
        {children}

        <FooterLinks>
          {data?.navigation?.links.map((link, index) => {
            const url = navigationLinkToUrl(link)

            return (
              <Link href={url} key={index} color="inherit" underline="none">
                {link.label}
              </Link>
            )
          })}
        </FooterLinks>
      </FooterInnerWrapper>
    </FooterWrapper>
  )
}
