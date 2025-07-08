import {AppBar, Box, GlobalStyles, SxProps, Theme, Toolbar, css, useTheme} from '@mui/material'
import styled from '@emotion/styled'
import {useUser} from '@wepublish/authentication/website'
import {FullNavigationFragment} from '@wepublish/website/api'
import {BuilderNavbarProps, Link, useWebsiteBuilder} from '@wepublish/website/builder'
import {PropsWithChildren, useCallback, useEffect, useMemo, useState} from 'react'
import {MdClose, MdMenu, MdWarning} from 'react-icons/md'
import {useTranslation} from 'react-i18next'
import {ButtonProps, TextToIcon, theme} from '@wepublish/ui'
import {navigationLinkToUrl} from 'libs/navigation/website/src/lib/link-to-url'
import {ImageWrapper} from '@wepublish/image/website'
import {prop} from 'ramda'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto'
  }
}

const cssVariables = (theme: Theme) => css`
  :root {
    --navbar-height: ${theme.spacing(6.5)};

    ${theme.breakpoints.up('md')} {
      --navbar-height: ${theme.spacing(7.5)};
    }

    ${theme.breakpoints.up('lg')} {
      --navbar-height: ${theme.spacing(16.5)};
    }
  }
`

export const NavbarWrapper = styled('nav')`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: ${({theme}) => theme.palette.background.default};
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
  grid-template-columns: max-content max-content 1fr;
  align-items: center;
  grid-auto-flow: column;
  justify-items: center;
  min-height: unset;
  padding: 0;
  margin: 0 auto;

  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
  transition: clip-path 500ms ease-out;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${({theme}) => theme.palette.primary.main};
    transition: clip-path 500ms ease-out;
    clip-path: polygon(0 99%, 100% 99%, 100% 100%, 0 100%);
  }

  ${({isScrolled, isMenuOpen}) =>
    isScrolled &&
    !isMenuOpen &&
    css`
      clip-path: polygon(0 0, 100% 0, 100% 40%, 0 90%);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      &::after {
        clip-path: polygon(0 89%, 100% 39%, 100% 40%, 0 90%);
      }
    `}

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr max-content 1fr;
      min-height: unset;
      padding: 0;
    }

    ${theme.breakpoints.up('md')} {
      min-height: unset;
      padding: 0;
    }
  `}
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
  height: var(--navbar-height);
  aspect-ratio: 1;
  color: ${({theme}) => theme.palette.text.primary};

  ${({theme}) => theme.breakpoints.up('md')} {
    svg {
      font-size: ${({theme}) => theme.spacing(4.5)};
    }
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    svg {
      font-size: ${({theme}) => theme.spacing(6.5)};
    }
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
  fill: currentColor;
  width: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 440px;
  gap: ${({theme}) => theme.spacing(1.5)};
`

const HauptstadtLogo = styled('img', {
  shouldForwardProp: propName => propName !== 'isScrolled' && propName !== 'isMenuOpen'
})<{isScrolled?: boolean; isMenuOpen?: boolean}>`
  width: 440px;
  transition: width 0.3s ease-out;

  ${({isScrolled, isMenuOpen}) =>
    isScrolled &&
    !isMenuOpen &&
    css`
      width: 330px;
    `}
`

const HauptstadtClaim = styled('img', {
  shouldForwardProp: propName => propName !== 'isScrolled' && propName !== 'isMenuOpen'
})<{isScrolled?: boolean; isMenuOpen?: boolean}>`
  width: 440px;
  transition: width 0.3s ease-out;

  ${({isScrolled, isMenuOpen}) =>
    isScrolled &&
    !isMenuOpen &&
    css`
      width: 0px;
    `}
`

export const NavbarSpacer = styled('div')``

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

  const {t} = useTranslation()

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
    elements: {IconButton, Image, Button}
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
              <IconButton size="large" aria-label="Menu" onClick={toggleMenu} color={'inherit'}>
                {!isMenuOpen && <MdMenu />}
                {isMenuOpen && <MdClose />}
              </IconButton>
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
              <HauptstadtLogo
                src="/logo.svg"
                isScrolled={isScrolled}
                isMenuOpen={isMenuOpen}
                loading="eager"
                fetchPriority="high"
              />
              <HauptstadtClaim
                src="/logo-claim.svg"
                isScrolled={isScrolled}
                isMenuOpen={isMenuOpen}
                loading="eager"
                fetchPriority="high"
              />
            </NavbarLogoWrapper>
          </NavbarLoginLink>

          <NavbarActions isMenuOpen={isMenuOpen}>
            {hasUnpaidInvoices && profileBtn && (
              <Button
                LinkComponent={Link}
                color="warning"
                startIcon={<MdWarning />}
                sx={buttonStyles}
                size="medium"
                {...profileBtn}>
                <Box sx={{display: {xs: 'none', md: 'unset'}}}>Offene</Box>&nbsp;Rechnung
              </Button>
            )}

            {!hasRunningSubscription && !hasUnpaidInvoices && subscribeBtn && (
              <Button LinkComponent={Link} sx={buttonStyles} size="medium" {...subscribeBtn}>
                {t('navbar.subscribe')}
              </Button>
            )}

            {hasRunningSubscription && !hasUnpaidInvoices && profileBtn && (
              <Button LinkComponent={Link} sx={buttonStyles} size="medium" {...profileBtn}>
                Mein Konto
              </Button>
            )}
          </NavbarActions>
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
  background-color: ${({theme}) => theme.palette.background.paper};
  color: ${({theme}) => theme.palette.primary.contrastText};
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  position: absolute;
  top: var(--navbar-height);
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
