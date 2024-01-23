import {AppBar, Theme, Toolbar, css, styled, useTheme} from '@mui/material'
import {FullNavigationFragment} from '@wepublish/website/api'
import {BuilderNavbarProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useCallback, useState} from 'react'
import {MdClose, MdMenu} from 'react-icons/md'
import {navigationLinkToUrl} from '../link-to-url'

export const NavbarWrapper = styled('nav')`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
`

const appBarStyles = (theme: Theme, isMenuOpen: boolean) =>
  isMenuOpen
    ? css`
        background-color: ${theme.palette.background.paper};
        color: ${theme.palette.primary.contrastText};
      `
    : null

export const NavbarInnerWrapper = styled(Toolbar)`
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

export const NavbarMain = styled('div')`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-self: start;
  gap: ${({theme}) => theme.spacing(2)};
`

export const NavbarMainItems = styled('div')<{show: boolean}>`
  display: none;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({theme}) => theme.spacing(2)};
  font-weight: ${({theme}) => theme.typography.fontWeightMedium};
  font-size: 1.125rem;
  text-transform: uppercase;

  ${({theme, show}) => css`
    ${theme.breakpoints.up('sm')} {
      display: ${show ? 'none' : 'grid'};
    }
  `}
`

export const NavbarIconButtonWrapper = styled('div')`
  background-color: #e91e63;
  display: flex;
  justify-content: center;
  align-items: center;
`

export function Navbar({
  className,
  children,
  categorySlugs,
  slug,
  data,
  loading,
  error
}: BuilderNavbarProps) {
  const theme = useTheme()
  const {
    elements: {IconButton, Link}
  } = useWebsiteBuilder()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const toggleMenu = useCallback(() => setMenuOpen(isOpen => !isOpen), [])

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
    <NavbarWrapper className={className}>
      <AppBar
        position="static"
        elevation={0}
        color={'transparent'}
        css={appBarStyles(theme, isMenuOpen)}>
        <NavbarInnerWrapper>
          <NavbarMain>
            <IconButtonWrapper>
              <IconButton size="large" color="secondary" aria-label="Menu" onClick={toggleMenu}>
                {!isMenuOpen && <MdMenu />}
                {isMenuOpen && <MdClose />}
              </IconButton>
            </IconButtonWrapper>

            <NavbarMainItems show={isMenuOpen}>
              {mainItems?.links?.map((link, index) => {
                const url = navigationLinkToUrl(link)

                return (
                  <Link
                    href={url}
                    key={index}
                    color="inherit"
                    underline="none"
                    onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </Link>
                )
              })}
            </NavbarMainItems>
          </NavbarMain>
        </NavbarInnerWrapper>
      </AppBar>

      {isMenuOpen && Boolean(mainItems || categories?.length) && (
        <NavPaper
          main={mainItems}
          categories={categories}
          closeMenu={toggleMenu}
          children={children}
        />
      )}
    </NavbarWrapper>
  )
}

export const NavPaperWrapper = styled('div')`
  padding: ${({theme}) => theme.spacing(2.5)};
  background-color: ${({theme}) => theme.palette.background.paper};
  color: ${({theme}) => theme.palette.primary.contrastText};
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transform: translateY(100%);

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(6)};
      grid-row-gap: ${theme.spacing(12)};
      grid-template-columns: 1fr 1fr;
      padding: ${theme.spacing(2.5)} calc(100% / 6) calc(100% / 12);
    }
  `}
`

export const NavPaperCategory = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-auto-rows: max-content;
`

export const Name = styled('span')`
  text-transform: uppercase;
  font-weight: 300;
  font-size: 14px;
`

export const Separator = styled('div')`
  width: 100%;
  height: 1px;
  background-color: white;

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      display: none;
    }
  `}
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

const navPaperLinkStyling = (theme: Theme) => css`
  ${theme.breakpoints.up('sm')} {
    border-bottom: 0;
  }
`

export const NavPaperCategoryLinks = styled('div')`
  display: grid;
  font-weight: ${({theme}) => theme.typography.fontWeightMedium};
  font-size: ${({theme}) => theme.typography.h6.fontSize};
`

export const NavPaperMainLinks = styled(NavPaperCategoryLinks)`
  gap: ${({theme}) => theme.spacing(1)};
`

export const NavPaperChildrenWrapper = styled('div')`
  position: relative;
  padding: ${({theme}) => theme.spacing(1.5)};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  justify-items: center;
  left: 0;
  top: 0;
  width: 100%;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      position: absolute;
      grid-template-columns: auto;
      justify-items: start;
      width: calc(100% / 6);
      gap: ${theme.spacing(3)};
      padding-top: ${theme.spacing(10)};
      padding-left: ${theme.spacing(4.5)};
    }
  `}
`

const NavPaper = ({
  main,
  categories,
  closeMenu,
  children
}: {
  main: FullNavigationFragment | null | undefined
  categories: FullNavigationFragment[][]
  closeMenu: () => void
  children: React.ReactNode
}) => {
  const {
    elements: {Link, H4, H6}
  } = useWebsiteBuilder()
  const theme = useTheme()

  return (
    <NavPaperWrapper>
      {children && <NavPaperChildrenWrapper>{children}</NavPaperChildrenWrapper>}
      
      {!!main?.links.length && (
        <NavPaperMainLinks>
          {main.links.map((link, index) => {
            const url = navigationLinkToUrl(link)

            return (
              <Link href={url} key={index} color="inherit" underline="none" onClick={closeMenu}>
                <H4>{link.label}</H4>
              </Link>
            )
          })}
        </NavPaperMainLinks>
      )}
      {!!categories.length && (
        <>
          {categories.map((categoryArray, arrayIndex) => (
            <LinksGroup key={arrayIndex}>
              {/* Render Separator for every array except the first one */}
              {arrayIndex > 0 && <Separator />}
              {categoryArray.map(nav => (
                <NavPaperCategory key={nav.id}>
                  <Name>{nav.name}</Name>

                  <NavPaperCategoryLinks>
                    {nav.links?.map((link, index) => {
                      const url = navigationLinkToUrl(link)

                      return (
                        <Link
                          href={url}
                          key={index}
                          color="inherit"
                          underline="none"
                          css={navPaperLinkStyling(theme)}
                          onClick={closeMenu}>
                          <H6>{link.label}</H6>
                        </Link>
                      )
                    })}
                  </NavPaperCategoryLinks>
                </NavPaperCategory>
              ))}
            </LinksGroup>
          ))}
        </>
      )}
    </NavPaperWrapper>
  )
}
