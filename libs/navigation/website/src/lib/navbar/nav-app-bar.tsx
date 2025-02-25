import {MdAccountCircle, MdClose, MdMenu, MdOutlinePayments} from 'react-icons/md'
import {AppBar, Box, css, styled, Toolbar, useTheme} from '@mui/material'
import {useMemo} from 'react'
import {BuilderNavAppBarProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {navigationLinkToUrl} from '../link-to-url'
import {UseToggle} from '@wepublish/ui'
import {useUser} from '@wepublish/authentication/website'
import {FullNavigationFragment} from '@wepublish/website/api'

export const NavAppBar = ({
  logo,
  loginUrl,
  profileUrl,
  subscriptionsUrl,
  headerItems,
  menuToggle,
  actions
}: BuilderNavAppBarProps) => {
  const appBarStyles = useAppBarStyles(menuToggle.value)
  return (
    <AppBar position="static" elevation={0} color={'transparent'} css={appBarStyles}>
      <NavbarInnerWrapper>
        <NavbarMain>
          <NavbarIconButtonWrapper>
            <NavbarOpenCloseButton toggle={menuToggle} />
          </NavbarIconButtonWrapper>
          {!!headerItems?.links.length && (
            <NavbarLinks isMenuOpen={menuToggle.value}>
              <MenuItems items={headerItems} />
            </NavbarLinks>
          )}
        </NavbarMain>

        <HomeLogoButton logo={logo} menuToggle={menuToggle} />
        <NavbarActions isMenuOpen={menuToggle.value}>
          {actions}
          <LoggedInButtons profileUrl={profileUrl} subscriptionsUrl={subscriptionsUrl} />
          <LoggedOutButtons loginUrl={loginUrl} />
        </NavbarActions>
      </NavbarInnerWrapper>
    </AppBar>
  )
}

type HomeLogoButton = Pick<BuilderNavAppBarProps, 'logo' | 'menuToggle'> & {className?: string}

export const HomeLogoButton = ({logo, menuToggle, className}: HomeLogoButton) => {
  const logoLinkStyles = useLogoLinkStyles(menuToggle.value)
  const imageStyles = useImageStyles()
  const {
    elements: {Link, Image}
  } = useWebsiteBuilder()
  return (
    <Link href="/" aria-label="Startseite" css={logoLinkStyles} className={className}>
      <NavbarLogoWrapper>
        {!!logo && <Image image={logo} css={imageStyles} loading="eager" fetchPriority="high" />}
      </NavbarLogoWrapper>
    </Link>
  )
}

type LoggedInButtonsProps = Pick<BuilderNavAppBarProps, 'subscriptionsUrl' | 'profileUrl'>

export const LoggedInButtons = ({subscriptionsUrl, profileUrl}: LoggedInButtonsProps) => {
  const {hasUser} = useUser()
  const {
    elements: {Link, IconButton}
  } = useWebsiteBuilder()

  if (!hasUser) {
    return <></>
  }
  return (
    <>
      {subscriptionsUrl && (
        <Link href={subscriptionsUrl}>
          <IconButton css={{fontSize: '2em', color: 'black'}}>
            <MdOutlinePayments aria-label={'Subscriptions'} />
          </IconButton>
        </Link>
      )}

      <Link href={profileUrl}>
        <IconButton className="login-button" css={{fontSize: '2em', color: 'black'}}>
          <MdAccountCircle aria-label="Profil" />
        </IconButton>
      </Link>
    </>
  )
}

type LoggedOutButtonsProps = Pick<BuilderNavAppBarProps, 'loginUrl'>

export const LoggedOutButtons = ({loginUrl}: LoggedOutButtonsProps) => {
  const {hasUser} = useUser()
  const {
    elements: {Link, IconButton}
  } = useWebsiteBuilder()

  if (hasUser) {
    return <></>
  }
  return (
    <>
      <Link href={loginUrl}>
        <IconButton className="login-button" css={{fontSize: '2em', color: 'black'}}>
          <MdAccountCircle aria-label="Login" />
        </IconButton>
      </Link>
    </>
  )
}

type MenuItemsProps = {
  items: FullNavigationFragment | null | undefined
}

export const MenuItems = ({items}: MenuItemsProps) => {
  const {
    elements: {Link}
  } = useWebsiteBuilder()
  return (
    <>
      {items?.links.map((link, index) => (
        <Link key={index} href={navigationLinkToUrl(link)}>
          {link.label}
        </Link>
      ))}
    </>
  )
}

export const useAppBarStyles = (isMenuOpen: boolean) => {
  const theme = useTheme()

  return useMemo(
    () =>
      isMenuOpen
        ? css`
            background-color: ${theme.palette.primary.main};
            color: ${theme.palette.primary.contrastText};
          `
        : null,
    [theme, isMenuOpen]
  )
}

export const NavbarInnerWrapper = styled(Toolbar)`
  display: grid;
  grid-template-columns: max-content max-content 1fr;
  align-items: center;
  grid-auto-flow: column;
  justify-items: center;
  min-height: unset;
  padding: 0;
`

export const NavbarLinks = styled('div')<{isMenuOpen?: boolean}>`
  display: none;
  gap: ${({theme}) => theme.spacing(2)};
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  ${({isMenuOpen}) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `} @media (
  min-width: 740px) {
    // custom for maximum space usage
    display: flex;
    a {
      font-size: 1rem;
      text-decoration: none;
      color: ${({theme}) => theme.palette.common.black};
      ${({theme}) => theme.breakpoints.up('md')} {
        font-size: 1.3rem;
      }
    }
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

export const NavbarActions = styled(Box)<{isMenuOpen?: boolean}>`
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
  ${({theme}) => theme.breakpoints.up('lg')} {
    padding-right: 0;
  }
`

export const NavbarIconButtonWrapper = styled('div')`
  background-color: ${({theme}) => theme.palette.primary.main};
  display: flex;
  justify-content: center;
  align-items: center;
  height: var(--navbar-height);
  aspect-ratio: 1;
  color: ${({theme}) => theme.palette.common.white};
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

const useLogoLinkStyles = (isMenuOpen: boolean) => {
  return useMemo(
    () => css`
      ${isMenuOpen &&
      css`
        z-index: -1;
      `}
    `,
    [isMenuOpen]
  )
}

export const NavbarLogoWrapper = styled('div')`
  fill: currentColor;
  width: auto;
`

const useImageStyles = () => {
  const theme = useTheme()
  return useMemo(
    () => css`
      max-height: ${theme.spacing(5)};
      max-width: ${theme.spacing(25)};
      ${theme.breakpoints.up('md')} {
        max-height: ${theme.spacing(6)};
        max-width: ${theme.spacing(30)};
      }
      ${theme.breakpoints.up('lg')} {
        max-height: ${theme.spacing(9)};
        max-width: ${theme.spacing(38)};
      }
    `,
    [theme]
  )
}

type NavbarOpenCloseButtonProps = {
  toggle: UseToggle
}

export const NavbarOpenCloseButton = ({toggle}: NavbarOpenCloseButtonProps) => {
  const {
    elements: {IconButton}
  } = useWebsiteBuilder()
  return (
    <IconButton size="large" aria-label="Menu" onClick={toggle.toggle} color={'inherit'}>
      {!toggle.value && <MdMenu />}
      {toggle.value && <MdClose />}
    </IconButton>
  )
}
