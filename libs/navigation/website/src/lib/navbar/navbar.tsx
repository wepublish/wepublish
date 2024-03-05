import {AppBar, Theme, Toolbar, css, styled, useTheme} from '@mui/material'
import {FullNavigationFragment} from '@wepublish/website/api'
import {BuilderNavbarProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {PropsWithChildren, useCallback, useState} from 'react'
import {MdAccountCircle, MdClose, MdMenu} from 'react-icons/md'
import {navigationLinkToUrl} from '../link-to-url'
import {Link} from '@wepublish/ui'

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
        background-color: ${theme.palette.primary.main};
        color: ${theme.palette.primary.contrastText};
      `
    : null

export const NavbarInnerWrapper = styled(Toolbar)`
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto;
  align-items: center;
  grid-auto-flow: column;
  justify-content: space-between;
  justify-items: center;
  min-height: unset;
  padding: 0;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      min-height: unset;
      padding-left: 0;
      grid-auto-columns: 1fr;
    }
  `}
`

const NavbarLinks = styled('div')<{isMenuOpen?: boolean}>`
  grid-column: 2;
  margin: 0 ${({theme}) => theme.spacing(1)};
  display: none;
  align-items: center;
  justify-content: flex-start;
  width: 100%;

  ${({isMenuOpen}) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}

  @media (min-width: 740px) {
    // custom for maximum space usage
    display: flex;
  }
`

const NavbarLink = styled('a')`
  font-size: 1rem;
  margin: 0 ${({theme}) => theme.spacing(1)} 0 ${({theme}) => theme.spacing(2)};
  text-decoration: none;
  color: ${({theme}) => theme.palette.common.black};

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 1.3rem;
  }
`

export const NavbarMain = styled('div')<{isMenuOpen?: boolean}>`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-self: start;
  gap: ${({theme}) => theme.spacing(2)};

  ${({isMenuOpen}) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}
`

export const NavbarActions = styled('div')<{isMenuOpen?: boolean}>`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-self: end;
  gap: ${({theme}) => theme.spacing(2)};
  grid-column: 4;
  justify-self: end;

  ${({isMenuOpen}) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}
`

export const NavbarIconButtonWrapper = styled('div')`
  background-color: ${({theme}) => theme.palette.primary.main};
  display: flex;
  justify-content: center;
  align-items: center;
`

const LogoLink = styled(Link)<{isMenuOpen?: boolean}>`
  color: unset;
  display: grid;
  align-items: center;
  justify-items: center;
  grid-column: 3;
  justify-self: center;

  ${({isMenuOpen}) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}
`

const LogoWrapper = styled('div')`
  fill: currentColor;
  width: auto;

  img {
    height: 46px;
    max-width: 200px;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    img {
      height: 52px;
      max-width: 240px;
    }
  }
`

export function Navbar({className, children, categorySlugs, slug, data, logo}: BuilderNavbarProps) {
  const theme = useTheme()
  const {
    elements: {IconButton, Image}
  } = useWebsiteBuilder()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const toggleMenu = useCallback(() => setMenuOpen(isOpen => !isOpen), [])

  const mainItems = data?.navigations?.find(({key}) => key === slug)
  const headerItems = data?.navigations?.find(({key}) => key === 'header')

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
            <NavbarIconButtonWrapper>
              <IconButton size="large" color="secondary" aria-label="Menu" onClick={toggleMenu}>
                {!isMenuOpen && <MdMenu />}
                {isMenuOpen && <MdClose />}
              </IconButton>
            </NavbarIconButtonWrapper>
          </NavbarMain>
          {!!headerItems?.links.length && (
            <NavbarLinks isMenuOpen={isMenuOpen}>
              {headerItems.links.map((link, index) => {
                const url = navigationLinkToUrl(link)
                return (
                  <NavbarLink key={index} href={url}>
                    {link.label}
                  </NavbarLink>
                )
              })}
            </NavbarLinks>
          )}
          {!!logo && (
            <LogoLink href="/" aria-label="Startseite" isMenuOpen={isMenuOpen}>
              <LogoWrapper>
                <Image image={logo} />
              </LogoWrapper>
            </LogoLink>
          )}
          <NavbarActions isMenuOpen={isMenuOpen}>
            <Link href="/login" aria-label="Login">
              <IconButton sx={{fontSize: '2em', color: 'black'}}>
                <MdAccountCircle />
              </IconButton>
            </Link>
          </NavbarActions>
        </NavbarInnerWrapper>
      </AppBar>

      {isMenuOpen && Boolean(mainItems || categories?.length) && (
        <NavPaper main={mainItems} categories={categories} closeMenu={toggleMenu}>
          {children}
        </NavPaper>
      )}
    </NavbarWrapper>
  )
}

export const NavPaperWrapper = styled('div')`
  padding: ${({theme}) => theme.spacing(2.5)};
  background-color: ${({theme}) => theme.palette.primary.main};
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
      row-gap: ${theme.spacing(12)};
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

export const NavPaperName = styled('span')`
  text-transform: uppercase;
  font-weight: 300;
  font-size: ${({theme}) => theme.typography.body2};
`

export const NavPaperSeparator = styled('hr')`
  width: 100%;
  height: 1px;
  background-color: ${({theme}) => theme.palette.common.white};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      display: none;
    }
  `}
`

export const NavPaperLinksGroup = styled('div')`
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
  width: 100%;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      position: absolute;
      grid-template-columns: auto;
      justify-items: start;
      width: calc(100% / 6);
      gap: ${theme.spacing(3)};
      padding-top: ${theme.spacing(10)};
      padding-left: ${theme.spacing(2)};
    }
  `}
`

const NavPaper = ({
  main,
  categories,
  closeMenu,
  children
}: PropsWithChildren<{
  main: FullNavigationFragment | null | undefined
  categories: FullNavigationFragment[][]
  closeMenu: () => void
}>) => {
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
                <H4 component="span" css={{fontWeight: '700'}}>
                  {link.label}
                </H4>
              </Link>
            )
          })}
        </NavPaperMainLinks>
      )}

      {!!categories.length &&
        categories.map((categoryArray, arrayIndex) => (
          <NavPaperLinksGroup key={arrayIndex}>
            {arrayIndex > 0 && <NavPaperSeparator />}

            {categoryArray.map(nav => (
              <NavPaperCategory key={nav.id}>
                <NavPaperName>{nav.name}</NavPaperName>

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
                        <H6 component="span" css={{fontWeight: '700'}}>
                          {link.label}
                        </H6>
                      </Link>
                    )
                  })}
                </NavPaperCategoryLinks>
              </NavPaperCategory>
            ))}
          </NavPaperLinksGroup>
        ))}
    </NavPaperWrapper>
  )
}
