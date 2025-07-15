/*
  @TODO:
  open invoices integration

  double check desktop boxing
  double check font weights (also blocks) on pages only

  @Lukas: when subscription exists on article pages, hide menu when scrolling down and show diagonal again on any scroll up event
*/

import styled from '@emotion/styled'
import {AppBar, Box, css, GlobalStyles, SxProps, Theme, Toolbar, useTheme} from '@mui/material'
import {useUser} from '@wepublish/authentication/website'
import {navigationLinkToUrl} from '@wepublish/navigation/website'
import {ButtonProps, TextToIcon} from '@wepublish/ui'
import {FullNavigationFragment} from '@wepublish/website/api'
import {BuilderNavbarProps, Link, useWebsiteBuilder} from '@wepublish/website/builder'
import {PropsWithChildren, useCallback, useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
// Feather icons as we can change the stroke width and Hauptstadt wants a thinner icon
import {FiMenu, FiPlus} from 'react-icons/fi'
import {MdSearch, MdWarning} from 'react-icons/md'

import {Tiempos} from '../theme'

const cssVariables = (theme: Theme) => css`
  :root {
    --navbar-height: 80px;

    ${theme.breakpoints.up('md')} {
      --navbar-height: 145px;
    }

    ${theme.breakpoints.up('lg')} {
      --navbar-height: 180px;
    }

    ${theme.breakpoints.up('xl')} {
      --navbar-height: 220px;
    }

    ${theme.breakpoints.up('xxl')} {
      --navbar-height: 260px;
    }
  }
`

export const NavbarWrapper = styled('nav')`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
`

const appBarStyles = (isMenuOpen: boolean) => (theme: Theme) =>
  isMenuOpen
    ? css`
        background-color: ${theme.palette.background.paper};
        color: ${theme.palette.primary.contrastText};
      `
    : null

export const NavbarInnerWrapper = styled(Toolbar, {
  shouldForwardProp: propName => propName !== 'isScrolled' && propName !== 'isMenuOpen'
})<{isScrolled?: boolean; isMenuOpen?: boolean}>`
  display: grid;
  grid-template-columns: 1fr max-content 1fr;
  row-gap: ${({theme}) => theme.spacing(0.5)};
  align-content: center;
  align-items: center;
  grid-auto-flow: column;
  justify-items: center;
  min-height: unset;
  padding: 0;
  margin: 0 auto;
  width: 100%;
  height: var(--navbar-height);
  background-color: ${({theme}) => theme.palette.background.paper};

  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
  transition: clip-path 500ms ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${({theme}) => theme.palette.background.paper};
    transition: clip-path 500ms ease-out;
    clip-path: polygon(0 95%, 100% 95%, 100% calc(100% - 1px), 0 calc(100% - 1px));
    z-index: 2;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${({theme}) => theme.palette.primary.main};
    transition: clip-path 500ms ease-out;
    clip-path: polygon(0 calc(100% - 1px), 100% calc(100% - 1px), 100% 100%, 0 100%);
    z-index: 10;
  }

  ${({isScrolled, isMenuOpen}) =>
    isScrolled &&
    !isMenuOpen &&
    css`
      clip-path: polygon(0 0, 100% 0, 100% 40%, 0 90%);
      box-shadow: 0 7px 10px -3px rgba(0, 0, 0, 0.18);

      &::before {
        clip-path: polygon(0 85%, 100% 35%, 100% 39%, 0 89%);
      }

      &::after {
        clip-path: polygon(0 89%, 100% 39%, 100% 40%, 0 90%);
      }
    `}

  ${({theme}) => theme.breakpoints.up('sm')} {
    min-height: unset;
    padding: 0;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    min-height: unset;
    padding: 0;
    row-gap: ${({theme}) => theme.spacing(1.5)};
  }
`

export const NavbarLinks = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen'
})<{isMenuOpen?: boolean}>`
  display: none;
  gap: ${({theme}) => theme.spacing(2)};
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

export const NavbarLink = styled(Link)`
  font-size: 1rem;
  text-decoration: none;
  color: ${({theme}) => theme.palette.common.black};

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 1.3rem;
  }
`

export const NavbarMain = styled('div')<{isMenuOpen?: boolean}>`
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: center;
  justify-self: start;
  gap: ${({theme}) => theme.spacing(2)};

  ${({isMenuOpen}) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}
`

export const NavbarActions = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen'
})<{isMenuOpen?: boolean}>`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-self: end;
  gap: ${({theme}) => theme.spacing(1)};
  padding-right: ${({theme}) => theme.spacing(1)};
  justify-self: end;

  ${({isMenuOpen}) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}

  ${({theme}) => theme.breakpoints.up('md')} {
    gap: ${({theme}) => theme.spacing(2)};
  }
`

export const NavbarIconButtonWrapper = styled('div')`
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1;
  padding-left: ${({theme}) => theme.spacing(1)};

  button {
    padding: 0;
  }

  svg {
    font-size: 28px;
    stroke-width: 1.25px;
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    svg {
      font-size: 35px;
    }
  }
`

export const NavbarSearchIconButtonWrapper = styled(NavbarIconButtonWrapper)`
  padding-left: 0;

  svg {
    stroke-width: 0;
  }
`

export const NavbarLoginLink = styled(Link, {
  shouldForwardProp: propName => propName !== 'isMenuOpen'
})<{isMenuOpen: boolean}>`
  color: unset;
  display: grid;
  align-items: center;
  justify-items: center;
  justify-self: center;

  ${({isMenuOpen}) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}
`

const buttonStyles: SxProps<Theme> = theme => ({
  [theme.breakpoints.up('sm')]: {
    fontSize: `calc(${theme.typography.button.fontSize} * 1.1)`,
    padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`
  }
})

export const NavbarLogoWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 220px;

  ${({theme}) => theme.breakpoints.up('md')} {
    width: 350px;
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    width: 440px;
  }

  ${({theme}) => theme.breakpoints.up('xl')} {
    width: 550px;
  }

  ${({theme}) => theme.breakpoints.up('xxl')} {
    width: 700px;
  }
`

export const HauptstadtClaimWrapper = styled(NavbarLogoWrapper)`
  grid-row: 2;
  grid-column: -1/1;
  height: 9px;

  ${({theme}) => theme.breakpoints.up('md')} {
    height: 14px;
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    height: 18px;
  }

  ${({theme}) => theme.breakpoints.up('xl')} {
    height: 22px;
  }

  ${({theme}) => theme.breakpoints.up('xxl')} {
    height: 29px;
  }
`

const HauptstadtLogo = styled('img', {
  shouldForwardProp: propName => propName !== 'isScrolled' && propName !== 'isMenuOpen'
})<{isScrolled?: boolean; isMenuOpen?: boolean}>`
  width: 100%;
  transition: width 0.3s ease-out;

  ${({theme, isScrolled, isMenuOpen}) =>
    isScrolled &&
    !isMenuOpen &&
    css`
      ${theme.breakpoints.up('md')} {
        width: 220px;
      }

      ${theme.breakpoints.up('lg')} {
        width: 330px;
      }

      ${theme.breakpoints.up('lg')} {
        width: 440px;
      }

      ${theme.breakpoints.up('xl')} {
        width: 550px;
      }

      ${theme.breakpoints.up('xxl')} {
        width: 700px;
      }
    `}
`

const HauptstadtClaim = styled('img', {
  shouldForwardProp: propName => propName !== 'isScrolled' && propName !== 'isMenuOpen'
})<{isScrolled?: boolean; isMenuOpen?: boolean}>`
  width: 100%;
  transition: width 0.3s ease-out;

  ${({isScrolled, isMenuOpen}) =>
    isScrolled &&
    !isMenuOpen &&
    css`
      width: 0px;
    `}
`

export interface ExtendedNavbarProps extends BuilderNavbarProps {
  isMenuOpen?: boolean
  onMenuToggle?: (isOpen: boolean) => void
  navPaperClassName?: string
}

export function HauptstadtNavbar({
  className,
  children,
  categorySlugs,
  slug,
  headerSlug,
  iconSlug,
  data,
  hasRunningSubscription,
  hasUnpaidInvoices,
  loginBtn = {href: '/login'},
  profileBtn = {href: '/profile'},
  subscribeBtn = {href: '/mitmachen'},
  isMenuOpen: controlledIsMenuOpen,
  onMenuToggle,
  navPaperClassName
}: ExtendedNavbarProps) {
  const [internalIsMenuOpen, setInternalMenuOpen] = useState(false)

  const [isScrolled, setIsScrolled] = useState(false)
  const isMenuOpen = controlledIsMenuOpen !== undefined ? controlledIsMenuOpen : internalIsMenuOpen
  const handleScroll = useCallback(() => setIsScrolled(window.scrollY > 50), [])

  const toggleMenu = useCallback(() => {
    const newState = !isMenuOpen

    if (controlledIsMenuOpen === undefined) {
      setInternalMenuOpen(newState)
    }

    onMenuToggle?.(newState)
  }, [isMenuOpen, controlledIsMenuOpen, onMenuToggle])

  const mainItems = data?.navigations?.find(({key}) => key === slug)
  const headerItems = data?.navigations?.find(({key}) => key === headerSlug)
  const iconItems = data?.navigations?.find(({key}) => key === iconSlug)

  const categories = useMemo(
    () =>
      categorySlugs.map(categorySlugArray =>
        categorySlugArray.reduce((navigations, categorySlug) => {
          const navItem = data?.navigations?.find(({key}) => key === categorySlug)

          if (navItem) {
            navigations.push(navItem)
          }

          return navigations
        }, [] as FullNavigationFragment[])
      ),
    [categorySlugs, data?.navigations]
  )

  const {
    elements: {IconButton, Button}
  } = useWebsiteBuilder()

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <NavbarWrapper className={className}>
      <GlobalStyles styles={theme => cssVariables(theme)} />

      <AppBar position="static" elevation={0} color={'transparent'} css={appBarStyles(isMenuOpen)}>
        <NavbarInnerWrapper isScrolled={isScrolled} isMenuOpen={isMenuOpen}>
          <NavbarMain>
            <NavbarIconButtonWrapper>
              <IconButton size="small" aria-label="Menu" onClick={toggleMenu} color={'inherit'}>
                {!isMenuOpen && <FiMenu />}
                {isMenuOpen && <FiPlus css={{transform: 'rotate(45deg)'}} />}
              </IconButton>

              {hasUnpaidInvoices && profileBtn && (
                <Button
                  LinkComponent={Link}
                  color="error"
                  startIcon={<MdWarning />}
                  sx={buttonStyles}
                  size="medium"
                  {...profileBtn}>
                  <Box sx={{display: {xs: 'none', md: 'unset'}}}>Offene</Box>&nbsp;Rechnung
                </Button>
              )}
            </NavbarIconButtonWrapper>

            {!!headerItems?.links.length && (
              <NavbarLinks isMenuOpen={isMenuOpen}>
                {headerItems.links.map((link, index) => (
                  <NavbarLink key={index} href={navigationLinkToUrl(link)}>
                    {link.label}
                  </NavbarLink>
                ))}
              </NavbarLinks>
            )}
          </NavbarMain>

          <NavbarLoginLink href="/" aria-label="Startseite" isMenuOpen={isMenuOpen}>
            <NavbarLogoWrapper>
              <HauptstadtLogo src="/logo.svg" isScrolled={isScrolled} isMenuOpen={isMenuOpen} />
            </NavbarLogoWrapper>
          </NavbarLoginLink>

          <NavbarActions isMenuOpen={isMenuOpen}>
            {(!isScrolled || isMenuOpen) && (
              <Link href="/search" color="inherit">
                <NavbarSearchIconButtonWrapper>
                  <IconButton color="inherit" size="small">
                    <MdSearch aria-label="Suche" />
                  </IconButton>
                </NavbarSearchIconButtonWrapper>
              </Link>
            )}
          </NavbarActions>

          <HauptstadtClaimWrapper>
            <HauptstadtClaim
              src="/logo-claim.svg"
              isScrolled={isScrolled}
              isMenuOpen={isMenuOpen}
            />
          </HauptstadtClaimWrapper>
        </NavbarInnerWrapper>
      </AppBar>

      {Boolean(mainItems || categories?.length) && (
        <NavPaper
          hasRunningSubscription={hasRunningSubscription}
          hasUnpaidInvoices={hasUnpaidInvoices}
          subscribeBtn={subscribeBtn}
          profileBtn={profileBtn}
          loginBtn={loginBtn}
          main={mainItems}
          categories={categories}
          closeMenu={toggleMenu}
          isMenuOpen={isMenuOpen}
          className={navPaperClassName}>
          {iconItems?.links.map((link, index) => (
            <Link
              key={index}
              href={navigationLinkToUrl(link)}
              onClick={() => {
                if (controlledIsMenuOpen === undefined) {
                  setInternalMenuOpen(false)
                }

                onMenuToggle?.(false)
              }}
              color="inherit">
              <TextToIcon title={link.label} size={32} />
            </Link>
          ))}

          {children}
        </NavPaper>
      )}
    </NavbarWrapper>
  )
}

export const NavPaperWrapper = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen'
})<{isMenuOpen: boolean}>`
  padding: ${({theme}) => theme.spacing(2.5)};
  background-color: ${({theme}) => theme.palette.primary.main};
  color: ${({theme}) => theme.palette.primary.contrastText};
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  position: absolute;
  top: calc(var(--navbar-height) - 2px);
  left: 0;
  right: 0;
  transform: translateX(${({isMenuOpen}) => (isMenuOpen ? '0' : '-100%')});
  transition: transform 0.3s ease-in-out;
  overflow-y: scroll;
  max-height: 100vh;
  padding-bottom: ${({theme}) => theme.spacing(10)};

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
  font-size: ${({theme}) => theme.typography.body2.fontSize};
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
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  grid-auto-rows: max-content;
  font-weight: ${({theme}) => theme.typography.fontWeightMedium};
  font-size: ${({theme}) => theme.typography.h6.fontSize};
`

export const NavPaperMainLinks = styled(NavPaperCategoryLinks)`
  gap: 0;

  span {
    font-family: ${Tiempos.style.fontFamily};
  }
`

export const NavPaperChildrenWrapper = styled('div')`
  position: relative;
  padding: ${({theme}) => theme.spacing(1.5)};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  justify-items: center;
  width: 100%;

  ${({theme}) => theme.breakpoints.up('md')} {
    position: absolute;
    grid-template-columns: auto;
    justify-items: start;
    width: calc(100% / 6);
    gap: ${({theme}) => theme.spacing(3)};
    padding-top: ${({theme}) => theme.spacing(10)};
    padding-left: ${({theme}) => theme.spacing(2)};
  }
`

export const NavPaperActions = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(2)};
  margin-top: ${({theme}) => theme.spacing(5)};
`

const NavPaper = ({
  main,
  categories,
  loginBtn,
  profileBtn,
  subscribeBtn,
  closeMenu,
  hasRunningSubscription,
  hasUnpaidInvoices,
  isMenuOpen,
  className,
  children
}: PropsWithChildren<{
  loginBtn?: ButtonProps | null
  profileBtn?: ButtonProps | null
  subscribeBtn?: ButtonProps | null
  main: FullNavigationFragment | null | undefined
  categories: FullNavigationFragment[][]
  closeMenu: () => void
  hasRunningSubscription: boolean
  hasUnpaidInvoices: boolean
  isMenuOpen: boolean
  className?: string
}>) => {
  const {
    elements: {Link, Button, H4, H6}
  } = useWebsiteBuilder()
  const {t} = useTranslation()
  const {hasUser, logout} = useUser()
  const theme = useTheme()

  const showMenu = true

  if (!showMenu) {
    return null
  }

  return (
    <NavPaperWrapper
      isMenuOpen={isMenuOpen}
      className={`${className || ''} ${isMenuOpen ? 'menu-open' : ''}`.trim()}>
      {children && <NavPaperChildrenWrapper>{children}</NavPaperChildrenWrapper>}

      <NavPaperMainLinks>
        {main?.links.map((link, index) => {
          const url = navigationLinkToUrl(link)

          return (
            <Link href={url} key={index} color="inherit" underline="none" onClick={closeMenu}>
              <H4 component="span" css={{fontWeight: '700'}}>
                {link.label}
              </H4>
            </Link>
          )
        })}

        <NavPaperActions>
          {hasUnpaidInvoices && profileBtn && (
            <Button
              LinkComponent={Link}
              variant="contained"
              color="warning"
              onClick={closeMenu}
              startIcon={<MdWarning />}
              {...profileBtn}>
              Offene Rechnung
            </Button>
          )}

          {!hasRunningSubscription && subscribeBtn && (
            <Button
              LinkComponent={Link}
              variant="contained"
              color="secondary"
              onClick={closeMenu}
              {...subscribeBtn}>
              {t('navbar.subscribe')}
            </Button>
          )}

          {hasUser && profileBtn && (
            <Button
              LinkComponent={Link}
              variant="outlined"
              color="secondary"
              onClick={closeMenu}
              {...profileBtn}>
              Mein Konto
            </Button>
          )}

          {hasUser && (
            <Button
              onClick={() => {
                logout()
                closeMenu()
              }}
              variant="contained"
              color="primary">
              Logout
            </Button>
          )}

          {!hasUser && loginBtn && (
            <Button
              LinkComponent={Link}
              variant="outlined"
              color="secondary"
              onClick={closeMenu}
              {...loginBtn}>
              Login
            </Button>
          )}
        </NavPaperActions>
      </NavPaperMainLinks>

      {!!categories.length &&
        categories.map((categoryArray, arrayIndex) => (
          <NavPaperLinksGroup key={arrayIndex}>
            {arrayIndex > 0 && <NavPaperSeparator />}

            {categoryArray.map(nav => (
              <NavPaperCategory key={nav.id}>
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
                        <H6 component="span" css={{fontWeight: '400'}}>
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
