import {Theme, Toolbar, css, useTheme} from '@mui/material'
import styled from '@emotion/styled'
import {FullNavigationFragment} from '@wepublish/website/api'
import {BuilderFooterProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {navigationLinkToUrl} from '../link-to-url'
import {useIntersectionObserver} from 'usehooks-ts'
import {forceHideBanner} from '@wepublish/banner/website'

export const FooterWrapper = styled('footer')`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
`

export const FooterInnerWrapper = styled(Toolbar)`
  display: grid;
  align-items: center;
  grid-auto-flow: column;
  justify-content: space-between;
  justify-items: center;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-auto-columns: 1fr;
    }
  `}
`

export const FooterMain = styled('div')`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-self: start;
  gap: ${({theme}) => theme.spacing(2)};
`

export const FooterMainItems = styled('div')<{show: boolean}>`
  display: none;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({theme}) => theme.spacing(2)};
  font-weight: ${({theme}) => theme.typography.fontWeightMedium};
  font-size: 1.125rem;
  text-transform: uppercase;

  ${({theme, show}) => css`
    ${theme.breakpoints.up('sm')} {
      display: ${show && 'grid'};
    }
  `}
`

export function Footer({className, categorySlugs, slug, data, loading, error}: BuilderFooterProps) {
  const mainItems = data?.navigations?.find(({key}) => key === slug)

  const categories = categorySlugs.map(categorySlugArray => {
    return categorySlugArray.reduce((navigations, categorySlug) => {
      const navItem = data?.navigations?.find(({key}) => key === categorySlug)

      if (navItem) {
        navigations.push(navItem)
      }

      return navigations
    }, [] as FullNavigationFragment[])
  })

  return (
    <FooterWrapper className={className}>
      <FooterPaper main={mainItems} categories={categories} />
    </FooterWrapper>
  )
}

export const FooterPaperWrapper = styled('div')`
  padding: ${({theme}) => theme.spacing(2.5)};
  background-color: ${({theme}) => theme.palette.grey[800]};
  color: ${({theme}) => theme.palette.getContrastText(theme.palette.grey[800])};
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transform: translateY(100%);
  overflow: hidden;
  row-gap: ${({theme}) => theme.spacing(8)};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(6)};
      row-gap: ${theme.spacing(12)};
      grid-template-columns: 1fr 1fr;
      padding: calc(100% / 12) calc(100% / 6);
    }
  `}
`

export const FooterPaperCategory = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-auto-rows: max-content;
`

export const FooterName = styled('span')`
  text-transform: uppercase;
  font-weight: 300;
  font-size: 14px;
`
export const FooterSeparator = styled('div')`
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
  height: 50%;
  background-color: ${({theme}) => theme.palette.common.black};
  z-index: -1;
  transform: translateY(-2rem);
`

export const LinksGroup = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr 1fr;
    }
  `}
`

const footerPaperLinkStyling = (theme: Theme) => css`
  ${theme.breakpoints.up('sm')} {
    border-bottom: 0;
  }
`

export const FooterPaperCategoryLinks = styled('div')`
  display: grid;
  font-weight: ${({theme}) => theme.typography.fontWeightMedium};
  font-size: ${({theme}) => theme.typography.h6.fontSize};
`

export const FooterPaperMainLinks = styled(FooterPaperCategoryLinks)`
  gap: ${({theme}) => theme.spacing(1)};
`

const FooterPaper = ({
  main,
  categories
}: {
  main: FullNavigationFragment | null | undefined
  categories: FullNavigationFragment[][]
}) => {
  const {isIntersecting, ref} = useIntersectionObserver({
    initialIsIntersecting: false,
    threshold: 0.9
  })
  const {
    elements: {Link, H4, H6}
  } = useWebsiteBuilder()
  const theme = useTheme()

  return (
    <FooterPaperWrapper ref={ref}>
      {!!main?.links.length && (
        <FooterPaperMainLinks>
          {main.links.map((link, index) => {
            const url = navigationLinkToUrl(link)

            return (
              <Link href={url} key={index} color="inherit" underline="none">
                <H4 component="span" css={{fontWeight: '700'}}>
                  {link.label}
                </H4>
              </Link>
            )
          })}
        </FooterPaperMainLinks>
      )}

      {!!categories.length && (
        <>
          {categories.map((categoryArray, arrayIndex) => (
            <LinksGroup key={`category-group-${arrayIndex}`}>
              {arrayIndex > 0 && <FooterSeparator />}
              {categoryArray.map(nav => (
                <FooterPaperCategory key={nav.id}>
                  <FooterName>{nav.name}</FooterName>

                  <FooterPaperCategoryLinks>
                    {nav.links?.map((link, index) => {
                      const url = navigationLinkToUrl(link)

                      return (
                        <Link
                          href={url}
                          key={index}
                          color="inherit"
                          underline="none"
                          css={footerPaperLinkStyling(theme)}>
                          <H6 component="span" css={{fontWeight: '700'}}>
                            {link.label}
                          </H6>
                        </Link>
                      )
                    })}
                  </FooterPaperCategoryLinks>
                </FooterPaperCategory>
              ))}
            </LinksGroup>
          ))}
        </>
      )}

      {isIntersecting && forceHideBanner}
    </FooterPaperWrapper>
  )
}
