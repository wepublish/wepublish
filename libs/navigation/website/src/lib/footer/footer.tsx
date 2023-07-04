import {Container, css, styled} from '@mui/material'
import {BuilderFooterProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {navigationLinkToUrl} from '../link-to-url'

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
      display: flex;
      flex-flow: row wrap;
    }
  `}
`

export function Footer({className, data, loading, error, children}: BuilderFooterProps) {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return (
    <FooterWrapper className={className}>
      <FooterInnerWrapper>
        {children}

        <FooterLinks>
          {data?.navigation?.links?.map((link, index) => {
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
