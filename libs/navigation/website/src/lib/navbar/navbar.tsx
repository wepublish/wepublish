import {css, GlobalStyles, styled, Theme} from '@mui/material'
import {FullNavigationFragment} from '@wepublish/website/api'
import {BuilderNavbarProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useToggle} from '@wepublish/ui'

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

export const NavbarSpacer = styled('div')``

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
  subscribeUrl = '/profile/subscription',
  hasRunningSubscription,
  hasUnpaidInvoices,
  ...menuProps
}: BuilderNavbarProps) {
  const menuToggle = useToggle()
  const {mainItems, headerItems, iconItems, categories} = getMenuItems(menuProps)
  const {NavPaper, NavAppBar} = useWebsiteBuilder()

  return (
    <NavbarWrapper className={className}>
      <GlobalStyles styles={theme => cssVariables(theme)} />
      <NavAppBar
        logo={logo}
        loginUrl={loginUrl}
        profileUrl={profileUrl}
        subscriptionsUrl={subscribeUrl}
        headerItems={headerItems}
        menuToggle={menuToggle}
      />

      {menuToggle.value && Boolean(mainItems || categories?.length) && (
        <NavPaper
          profileUrl={profileUrl}
          subscriptionsUrl={subscribeUrl}
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
