import {AppBar, TextField, Theme, Toolbar, css, styled, useTheme} from '@mui/material'
import {useUser} from '@wepublish/authentication/website'
import {Button} from '@wepublish/ui'
import {FullNavigationFragment} from '@wepublish/website/api'
import {BuilderNavbarProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useRouter} from 'next/router'
import {PropsWithChildren, useCallback, useMemo, useState} from 'react'
import {MdAccountCircle, MdClose, MdMenu, MdOutlinePayments} from 'react-icons/md'
import {navigationLinkToUrl} from '../link-to-url'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto'
  }
}

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
  grid-template-columns: auto 1fr auto 1fr auto;
  align-items: center;
  grid-auto-flow: column;
  justify-content: space-between;
  justify-items: center;
  min-height: unset;
  padding: 0;

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      min-height: unset;
      padding: 0;
      grid-auto-columns: 1fr;
    }

    ${theme.breakpoints.up('md')} {
      min-height: unset;
      padding: 0;
      grid-auto-columns: 1fr;
    }
  `}
`

export const NavbarLinks = styled('div')<{isMenuOpen?: boolean}>`
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

const useNavbarLinkStyles = () => {
  const theme = useTheme()

  return useMemo(
    () => css`
      font-size: 1rem;
      margin: 0 ${theme.spacing(1)} 0 ${theme.spacing(2)};
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
  grid-column: 5;
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
  width: ${({theme}) => theme.spacing(6.5)};
  height: ${({theme}) => theme.spacing(6.5)};
  color: ${({theme}) => theme.palette.common.white};

  ${({theme}) => theme.breakpoints.up('md')} {
    width: ${({theme}) => theme.spacing(7.5)};
    height: ${({theme}) => theme.spacing(7.5)};

    svg {
      font-size: ${({theme}) => theme.spacing(4.5)};
    }
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    width: ${({theme}) => theme.spacing(12.5)};
    height: ${({theme}) => theme.spacing(12.5)};

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
      grid-column: 3;
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

export const NavbarSpacer = styled('div')`
  grid-column: 4;
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

export const SearchBar = styled('div')`
  display: flex;
  padding: ${({theme}) => theme.spacing(2)};
  flex-wrap: nowrap;
  align-items: center;
  justify-self: start;
  gap: ${({theme}) => theme.spacing(2)};
  grid-column: 1/5;
  width: 100%;
  border-bottom: 1px solid ${({theme}) => theme.palette.divider};
`

export const SearchInput = styled(TextField)`
  width: 100%;
`

export const SearchForm = styled('form')`
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
`

export const SearchButton = styled(Button)`
  margin-left: ${({theme}) => theme.spacing(2)};
`

export function Navbar({
  className,
  children,
  categorySlugs,
  slug,
  headerSlug,
  data,
  logo,
  loginUrl = '/login',
  profileUrl = '/profile',
  subscriptionsUrl = '/profile/subscription',
  showSubscriptionsUrl = true
}: BuilderNavbarProps) {
  const {hasUser} = useUser()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [rawQuery, setRawQuery] = useState('')
  const toggleMenu = useCallback(() => setMenuOpen(isOpen => !isOpen), [])

  const router = useRouter()

  const imageStyles = useImageStyles()
  const appBarStyles = useAppBarStyles(isMenuOpen)
  const logoLinkStyles = useLogoLinkStyles(isMenuOpen)
  const navbarLinkStyles = useNavbarLinkStyles()

  const mainItems = data?.navigations?.find(({key}) => key === slug)
  const headerItems = data?.navigations?.find(({key}) => key === headerSlug)

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
    elements: {IconButton, Image, Link}
  } = useWebsiteBuilder()

  return (
    <NavbarWrapper className={className}>
      <>
        <AppBar position="static" elevation={0} color={'transparent'} css={appBarStyles}>
          <NavbarInnerWrapper>
            <>
              <NavbarMain>
                <NavbarIconButtonWrapper>
                  <IconButton
                    size="large"
                    aria-label="Menu"
                    onClick={toggleMenu}
                    css={{color: 'white'}}>
                    {!isMenuOpen && <MdMenu />}
                    {isMenuOpen && <MdClose />}
                  </IconButton>
                </NavbarIconButtonWrapper>
              </NavbarMain>
              {!!headerItems?.links.length && (
                <NavbarLinks isMenuOpen={isMenuOpen}>
                  {headerItems.links.map((link, index) => (
                    <Link key={index} css={navbarLinkStyles} href={navigationLinkToUrl(link)}>
                      {link.label}
                    </Link>
                  ))}
                </NavbarLinks>
              )}
              {!!logo && (
                <Link href="/" aria-label="Startseite" css={logoLinkStyles}>
                  <NavbarLogoWrapper>
                    <Image image={logo} css={imageStyles} loading="eager" fetchPriority="high" />
                  </NavbarLogoWrapper>
                </Link>
              )}
              <NavbarSpacer />
              <NavbarActions isMenuOpen={isMenuOpen}>
                {hasUser && showSubscriptionsUrl ? (
                  <Link href={subscriptionsUrl} aria-label={hasUser ? 'Profil' : 'Login'}>
                    <IconButton css={{fontSize: '2em', color: 'black'}}>
                      <MdOutlinePayments />
                    </IconButton>
                  </Link>
                ) : null}

                <Link
                  href={hasUser ? profileUrl : loginUrl}
                  aria-label={hasUser ? 'Profil' : 'Login'}>
                  <IconButton css={{fontSize: '2em', color: 'black'}}>
                    <MdAccountCircle />
                  </IconButton>
                </Link>
              </NavbarActions>
            </>
          </NavbarInnerWrapper>
        </AppBar>

        {isMenuOpen && Boolean(mainItems || categories?.length) && (
          <NavPaper
            profileUrl={profileUrl}
            loginUrl={loginUrl}
            main={mainItems}
            categories={categories}
            closeMenu={toggleMenu}>
            {children}
          </NavPaper>
        )}
      </>
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
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({theme}) => theme.spacing(2)};
  margin-top: ${({theme}) => theme.spacing(5)};
`

const NavPaper = ({
  main,
  categories,
  loginUrl,
  profileUrl,
  closeMenu,
  children
}: PropsWithChildren<{
  loginUrl: string
  profileUrl: string
  main: FullNavigationFragment | null | undefined
  categories: FullNavigationFragment[][]
  closeMenu: () => void
}>) => {
  const {
    elements: {Link, Button, H4, H6}
  } = useWebsiteBuilder()
  const {hasUser, logout} = useUser()
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

          <NavPaperActions>
            {!hasUser && (
              <Button
                LinkComponent={Link}
                href={loginUrl}
                variant="contained"
                color="secondary"
                onClick={closeMenu}>
                Login
              </Button>
            )}

            {hasUser && (
              <>
                <Button
                  LinkComponent={Link}
                  href={profileUrl}
                  variant="contained"
                  color="secondary"
                  onClick={closeMenu}>
                  Mein Konto
                </Button>

                <Button
                  onClick={() => {
                    logout()
                    closeMenu()
                  }}
                  variant="outlined"
                  color="secondary">
                  Logout
                </Button>
              </>
            )}
          </NavPaperActions>
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
