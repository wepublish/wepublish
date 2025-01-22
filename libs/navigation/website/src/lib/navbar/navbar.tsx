import {
  AppBar,
  css,
  GlobalStyles,
  IconButton,
  styled,
  Theme,
  Toolbar,
  useTheme
} from '@mui/material'
import {useUser} from '@wepublish/authentication/website'
import {FullNavigationFragment} from '@wepublish/website/api'
import {BuilderNavbarProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useMemo} from 'react'
import {MdAccountCircle, MdClose, MdMenu, MdOutlinePayments} from 'react-icons/md'
import {navigationLinkToUrl} from '../link-to-url'
import {useToggle, UseToggle} from '@wepublish/ui'

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
      --navbar-height: ${theme.spacing(12.5)};
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

const useAppBarStyles = (isMenuOpen: boolean) => {
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
  }
`

const useNavbarLinkStyles = () => {
  const theme = useTheme()

  return useMemo(
    () => css`
      font-size: 1rem;
      text-decoration: none;
      color: ${theme.palette.common.black};

      ${theme.breakpoints.up('md')} {
        font-size: 1.3rem;
      }
    `,
    [theme]
  )
}

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

export const NavbarActions = styled('div')<{isMenuOpen?: boolean}>`
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
      color: unset;
      display: grid;
      align-items: center;
      justify-items: center;
      justify-self: center;

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

export const NavbarSpacer = styled('div')``

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

export const getMenuItems = (
  props: Pick<BuilderNavbarProps, 'data' | 'slug' | 'headerSlug' | 'iconSlug' | 'categorySlugs'>
) => {
  const {data, slug, headerSlug, iconSlug, categorySlugs} = props
  const mainItems = data?.navigations?.find(({key}) => key === slug)
  const headerItems = data?.navigations?.find(({key}) => key === headerSlug)
  const iconItems = data?.navigations?.find(({key}) => key === iconSlug)

  const categories = categorySlugs.map(categorySlugArray =>
    categorySlugArray.reduce((navigations, categorySlug) => {
      const navItem = data?.navigations?.find(({key}) => key === categorySlug)

      if (navItem) {
        navigations.push(navItem)
      }

      return navigations
    }, [] as FullNavigationFragment[])
  )

  return {
    mainItems,
    headerItems,
    iconItems,
    categories
  }
}

export function Navbar({
  className,
  children,
  logo,
  loginUrl = '/login',
  profileUrl = '/profile',
  subscriptionsUrl = '/profile/subscription',
  actions,
  ...menuProps
}: BuilderNavbarProps) {
  const {hasUser} = useUser()
  const menuToggle = useToggle()

  const imageStyles = useImageStyles()
  const appBarStyles = useAppBarStyles(menuToggle.value)
  const logoLinkStyles = useLogoLinkStyles(menuToggle.value)
  const navbarLinkStyles = useNavbarLinkStyles()

  const {mainItems, headerItems, iconItems, categories} = getMenuItems(menuProps)

  const {
    elements: {IconButton, Image, Link},
    NavPaper
  } = useWebsiteBuilder()

  return (
    <NavbarWrapper className={className}>
      <GlobalStyles styles={theme => cssVariables(theme)} />
      <AppBar position="static" elevation={0} color={'transparent'} css={appBarStyles}>
        <NavbarInnerWrapper>
          <NavbarMain>
            <NavbarOpenCloseButton toggle={menuToggle} />

            {!!headerItems?.links.length && (
              <NavbarLinks isMenuOpen={menuToggle.value}>
                {headerItems.links.map((link, index) => (
                  <Link key={index} css={navbarLinkStyles} href={navigationLinkToUrl(link)}>
                    {link.label}
                  </Link>
                ))}
              </NavbarLinks>
            )}
          </NavbarMain>

          <Link href="/" aria-label="Startseite" css={logoLinkStyles}>
            <NavbarLogoWrapper>
              {!!logo && (
                <Image image={logo} css={imageStyles} loading="eager" fetchPriority="high" />
              )}
            </NavbarLogoWrapper>
          </Link>

          <NavbarActions isMenuOpen={menuToggle.value}>
            {actions}

            {hasUser && (
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
            )}

            {!hasUser && (
              <Link href={loginUrl}>
                <IconButton className="login-button" css={{fontSize: '2em', color: 'black'}}>
                  <MdAccountCircle aria-label="Login" />
                </IconButton>
              </Link>
            )}
          </NavbarActions>
        </NavbarInnerWrapper>
      </AppBar>

      {menuToggle.value && Boolean(mainItems || categories?.length) && (
        <NavPaper
          profileUrl={profileUrl}
          subscriptionsUrl={subscriptionsUrl}
          loginUrl={loginUrl}
          main={mainItems}
          categories={categories}
          iconItems={iconItems}
          closeMenu={menuToggle.off}>
          {children}
        </NavPaper>
      )}
    </NavbarWrapper>
  )
}

type NavbarOpenCloseButtonProps = {
  toggle: UseToggle
}

export const NavbarOpenCloseButton = ({toggle}: NavbarOpenCloseButtonProps) => (
  <NavbarIconButtonWrapper>
    <IconButton size="large" aria-label="Menu" onClick={toggle.toggle} color={'inherit'}>
      {!toggle.value && <MdMenu />}
      {toggle.value && <MdClose />}
    </IconButton>
  </NavbarIconButtonWrapper>
)
