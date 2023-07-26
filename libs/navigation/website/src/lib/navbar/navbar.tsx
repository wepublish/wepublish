import {Theme, css, styled, useTheme} from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import {FullNavigationFragment} from '@wepublish/website/api'
import {BuilderNavbarProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Reducer, useReducer} from 'react'
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
        background-color: ${theme.palette.primary.main};
        color: ${theme.palette.primary.contrastText};
      `
    : undefined

export const NavbarInnerWrapper = styled(Toolbar)`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
`

export const NavbarMain = styled('div')`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
`

export const NavbarMainItems = styled('div')`
  display: none;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({theme}) => theme.spacing(2)};
  font-weight: ${({theme}) => theme.typography.fontWeightMedium};
  font-size: 1.125rem;
  text-transform: uppercase;
  margin-left: ${({theme}) => theme.spacing(2)};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      display: grid;
    }
  `}
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
  const [isMenuOpen, toggleMenu] = useReducer<Reducer<boolean, void>>(state => !state, false)

  const mainItems = data?.navigations?.find(({key}) => key === slug)
  const categories = categorySlugs.reduce((navigations, categorySlug) => {
    const navItem = data?.navigations?.find(({key}) => key === categorySlug)

    if (navItem) {
      navigations.push(navItem)
    }

    return navigations
  }, [] as FullNavigationFragment[])

  return (
    <NavbarWrapper className={className}>
      <AppBar
        position="static"
        elevation={0}
        color={'transparent'}
        css={appBarStyles(theme, isMenuOpen)}>
        <NavbarInnerWrapper>
          <NavbarMain>
            <IconButton
              size="large"
              color={isMenuOpen ? 'inherit' : 'primary'}
              edge="start"
              aria-label="Menu"
              onClick={toggleMenu}>
              {!isMenuOpen && <MdMenu />}
              {isMenuOpen && <MdClose />}
            </IconButton>

            <NavbarMainItems>
              {mainItems?.links?.map((link, index) => {
                const url = navigationLinkToUrl(link)

                return (
                  <Link href={url} key={index} color="inherit" underline="none">
                    {link.label}
                  </Link>
                )
              })}
            </NavbarMainItems>
          </NavbarMain>

          {children}
        </NavbarInnerWrapper>
      </AppBar>

      {isMenuOpen && Boolean(mainItems || categories?.length) && (
        <NavPaper main={mainItems} categories={categories} />
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
`

export const NavPaperCategoryList = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      grid-auto-flow: column;
      grid-auto-columns: max-content;
    }
  `}
`

export const NavPaperCategory = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

const navPaperLinkStyling = (theme: Theme) => css`
  border-bottom: 2px solid currentColor;

  ${theme.breakpoints.up('sm')} {
    border-bottom: 0;
  }
`

export const NavPaperCategoryLinks = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  text-transform: uppercase;
  font-weight: ${({theme}) => theme.typography.fontWeightMedium};
  font-size: ${({theme}) => theme.typography.h6.fontSize};
`

export const NavPaperMainLinks = styled(NavPaperCategoryLinks)`
  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      display: none;
    }
  `}
`

const NavPaper = ({
  main,
  categories
}: {
  main: FullNavigationFragment | null | undefined
  categories: FullNavigationFragment[]
}) => {
  const {
    elements: {Link, H5}
  } = useWebsiteBuilder()
  const theme = useTheme()

  return (
    <NavPaperWrapper>
      {!!main?.links.length && (
        <NavPaperMainLinks>
          {main.links.map((link, index) => {
            const url = navigationLinkToUrl(link)

            return (
              <Link href={url} key={index} color="inherit" underline="none">
                {link.label}
              </Link>
            )
          })}
        </NavPaperMainLinks>
      )}

      {!!categories.length && (
        <NavPaperCategoryList>
          {categories.map(nav => (
            <NavPaperCategory key={nav.id}>
              <H5 component="div">{nav.name}</H5>

              <NavPaperCategoryLinks>
                {nav.links?.map((link, index) => {
                  const url = navigationLinkToUrl(link)

                  return (
                    <Link
                      href={url}
                      key={index}
                      color="inherit"
                      underline="none"
                      css={navPaperLinkStyling(theme)}>
                      {link.label}
                    </Link>
                  )
                })}
              </NavPaperCategoryLinks>
            </NavPaperCategory>
          ))}
        </NavPaperCategoryList>
      )}
    </NavPaperWrapper>
  )
}
