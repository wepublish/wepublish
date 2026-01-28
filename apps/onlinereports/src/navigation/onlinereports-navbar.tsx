import styled from '@emotion/styled';
import { css, GlobalStyles, Theme } from '@mui/material';
import { FullNavigationFragment } from '@wepublish/website/api';
import { BuilderNavbarProps } from '@wepublish/website/builder';

import { useToggle } from '../use-toggle';
import { OnlineReportsNavAppBar } from './onlinereports-nav-app-bar';
import { OnlineReportsNavPaper } from './onlinereports-nav-paper';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto';
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
`;

export const NavbarWrapper = styled('nav')`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: ${({ theme }) => theme.palette.background.default};
`;

export const NavbarSpacer = styled('div')``;

export const getMenuItems = (
  props: Pick<
    BuilderNavbarProps,
    'data' | 'slug' | 'headerSlug' | 'iconSlug' | 'categorySlugs'
  >
) => {
  const { data, slug, headerSlug, iconSlug, categorySlugs } = props;
  const mainItems = data?.navigations?.find(({ key }) => key === slug);
  const headerItems = data?.navigations?.find(({ key }) => key === headerSlug);
  const iconItems = data?.navigations?.find(({ key }) => key === iconSlug);

  const categories = categorySlugs.map(categorySlugArray =>
    categorySlugArray.reduce((navigations, categorySlug) => {
      const navItem = data?.navigations?.find(
        ({ key }) => key === categorySlug
      );

      if (navItem) {
        navigations.push(navItem);
      }

      return navigations;
    }, [] as FullNavigationFragment[])
  );

  return {
    mainItems,
    headerItems,
    iconItems,
    categories,
  };
};

export function OnlineReportsNavbar({
  className,
  children,
  logo,
  loginBtn,
  profileBtn,
  subscribeBtn,
  hasRunningSubscription,
  hasUnpaidInvoices,
  ...menuProps
}: BuilderNavbarProps) {
  const menuToggle = useToggle();
  const { mainItems, headerItems, iconItems, categories } =
    getMenuItems(menuProps);

  return (
    <NavbarWrapper className={className}>
      <GlobalStyles styles={theme => cssVariables(theme)} />
      <OnlineReportsNavAppBar
        logo={logo}
        loginBtn={loginBtn}
        profileBtn={profileBtn}
        subscribeBtn={subscribeBtn}
        headerItems={headerItems}
        menuToggle={menuToggle}
      />

      {menuToggle.value && Boolean(mainItems || categories?.length) && (
        <OnlineReportsNavPaper
          loginBtn={loginBtn}
          profileBtn={profileBtn}
          subscribeBtn={subscribeBtn}
          main={mainItems}
          categories={categories}
          iconItems={iconItems}
          closeMenu={menuToggle.off}
        >
          {children}
        </OnlineReportsNavPaper>
      )}
    </NavbarWrapper>
  );
}
