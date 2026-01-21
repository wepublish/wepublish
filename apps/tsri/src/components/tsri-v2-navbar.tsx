import styled from '@emotion/styled';
import {
  AppBar as MuiAppBar,
  Box,
  capitalize,
  css,
  GlobalStyles,
  SxProps,
  Theme,
  Toolbar,
} from '@mui/material';
import { useUser } from '@wepublish/authentication/website';
import { useHasActiveSubscription } from '@wepublish/membership/website';
import { navigationLinkToUrl } from '@wepublish/navigation/website';
import { ButtonProps, TextToIcon } from '@wepublish/ui';
import { FullNavigationFragment } from '@wepublish/website/api';
import { PageType } from '@wepublish/website/builder';
import {
  BuilderNavbarProps,
  IconButton,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import {
  forwardRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { FiInstagram, FiMenu as FiMenuDefault, FiSearch } from 'react-icons/fi';
import { MdWarning } from 'react-icons/md';

import theme from '../theme';

enum NavbarState {
  Low,
  High,
  IsLoggedOut,
  IsLoggedIn,
}

enum ScrollDirection {
  Up,
  Down,
}

const cssVariables = (state: NavbarState[], isHomePage: boolean) => css`
  :root {
    ${isHomePage ?
      `
        --navbar-height: -10px;
        --navbar-aspect-ratio: 3.7 / 1;
        --scrolled-navbar-aspect-ratio: 3.7 / 1;

      ${theme.breakpoints.up('md')} {
        --navbar-height: -10px;
        --navbar-aspect-ratio: 6.5 / 1;
        --scrolled-navbar-aspect-ratio: 9 / 1;
      }
    `
    : `
    --navbar-aspect-ratio: 3.1 / 1;
    --scrolled-navbar-aspect-ratio: 3.1 / 1;

      ${theme.breakpoints.up('md')} {
        --navbar-aspect-ratio: 8 / 1;
        --scrolled-navbar-aspect-ratio: 9.5 / 1;
      }
    `}
    --changing-aspect-ratio: ${state.includes(NavbarState.Low) ?
      'var(--navbar-aspect-ratio)'
    : 'var(--scrolled-navbar-aspect-ratio)'};
  }
`;

export const AppBar = styled(MuiAppBar, {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen?: boolean }>`
  background-color: ${({ theme }) => theme.palette.common.white};
  position: relative;

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      background-color: transparent;
    `}
`;

export const NavbarWrapper = styled('nav')`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  height: auto;
  pointer-events: none;
  margin-bottom: calc(${({ theme }) => theme.spacing(-3)} + 1px);
  --sizing-factor: 2.7;

  > * {
    pointer-events: all;
  }

  ${theme.breakpoints.up('md')} {
    --sizing-factor: 1;
  }
`;

const getNavbarState = (
  isScrolled: boolean,
  scrollDirection: ScrollDirection,
  hasActiveSubscription: boolean,
  isLoggedOut: boolean
): NavbarState[] => {
  const navbarStates: NavbarState[] = [];

  if (!isScrolled) {
    navbarStates.push(NavbarState.Low);
  }

  if (hasActiveSubscription) {
    if (scrollDirection === ScrollDirection.Down) {
      navbarStates.push(NavbarState.Low);
    }
  }

  if (isLoggedOut) {
    navbarStates.push(NavbarState.IsLoggedOut);
  } else {
    navbarStates.push(NavbarState.IsLoggedIn);
  }

  if (!navbarStates.includes(NavbarState.Low)) {
    navbarStates.push(NavbarState.High);
  }

  return navbarStates;
};

export const navbarButtonStyles = (theme: Theme) => css`
  padding: 0;
  background-color: ${theme.palette.common.black};
  border-radius: 50%;
  width: 14cqw;
  height: 14cqw;

  > svg {
    stroke-width: 1.25px;
    stroke: ${theme.palette.common.white};
    font-size: 8.5cqw;
  }

  &:hover {
    background-color: ${theme.palette.primary.light};
    > svg {
      stroke: ${theme.palette.common.black};
    }
  }

  ${theme.breakpoints.up('md')} {
    width: 3.917442cqw;
    height: 3.917442cqw;

    & > svg {
      font-size: 2.5cqw;
    }
  }
`;

export const NavbarInstaButton = styled(IconButton)`
  ${navbarButtonStyles(theme)}
  opacity: 0;
  transition: opacity 300ms ease-in-out;
  pointer-events: none;
`;

const FiMenu = styled(FiMenuDefault)`
  transition: transform 300ms ease-out;
  transform: rotate(0);
`;

export const NavbarHamburgerButton = styled(IconButton)`
  ${navbarButtonStyles(theme)}
`;

export const NavbarSearchButton = styled(IconButton)`
  ${navbarButtonStyles(theme)}
`;

export const NavbarIconButtonWrapper = styled('div')``;

export const NavbarMain = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen?: boolean }>`
  grid-column: 3 / 4;
  grid-row: 1 / 2;
  margin: 4cqw 2.5cqw 0 0;
  column-gap: 2.5cqw;

  display: grid;
  grid-template-columns: repeat(3, min-content);
  align-items: center;
  justify-self: end;
  align-self: flex-start;
  pointer-events: all;
  z-index: 30;

  ${theme.breakpoints.up('md')} {
    column-gap: 0.9cqw;
    margin: 1.3cqw 2.5cqw 0 0;
  }

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      ${NavbarInstaButton} {
        opacity: 1;
        pointer-events: all;
      }
      ${FiMenu} {
        transform: rotate(90deg);
      }
    `}
`;

export const NavbarActions = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen?: boolean }>`
  display: none;
  flex-flow: row wrap;
  align-items: center;
  gap: 1cqw;
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  align-self: flex-start;
  justify-self: end;
  margin-top: 1.9cqw;
  z-index: 20;
  pointer-events: all;
  padding-right: 1.5cqw;

  ${theme.breakpoints.up('md')} {
    display: flex;
  }
`;

export const NavbarLoginLink = styled(Link)`
  color: unset;
  position: relative;
  grid-column: 1 / 2;
  grid-row: -1 / 1;
  align-self: flex-start;
  display: grid;
  align-items: center;
  justify-items: center;
  justify-self: left;
  visibility: visible;
  transition: visibility 300ms ease-in-out;
`;

const TsriLogo = styled('img', {
  shouldForwardProp: propName =>
    propName !== 'isScrolled' && propName !== 'isHomePage',
})<{ isScrolled?: boolean; isHomePage?: boolean }>`
  transition: width 300ms ease-out;
  transform: translate3d(0, 0, 0);
  position: absolute;

  width: 40cqw;
  height: auto;
  top: 3cqw;
  left: 2cqw;

  ${theme.breakpoints.up('md')} {
    // not scrolled --> blue logo, larger
    width: 24.2cqw;
    height: auto;
    top: 0.5cqw;
    left: 2cqw;

    // scrolled --> blue logo, smaller
    ${({ isScrolled }) =>
      isScrolled &&
      css`
        width: 18.6cqw;
      `}

    // on home page, not scrolled --> black logo, larger
    ${({ isHomePage }) =>
      isHomePage &&
      css`
        width: 32.55cqw;
      `}

      // on home page, scrolled --> black logo, smaller
    ${({ isScrolled, isHomePage }) =>
      isHomePage &&
      isScrolled &&
      css`
        width: 21cqw;
      `}
  }
`;

const TsriClaim = styled('img', {
  shouldForwardProp: propName =>
    propName !== 'isScrolled' && propName !== 'isHomePage',
})<{ isScrolled?: boolean; isHomePage?: boolean }>`
  transition:
    width 300ms ease-out,
    top 300ms ease-out;
  transform: translate3d(0, 0, 0);
  position: absolute;
  clip-path: inset(10px 0 10px 0);
  width: 26cqw;
  height: auto;
  top: 13.5cqw;
  top: 12.8cqw;
  left: 2cqw;

  ${({ isScrolled }) =>
    isScrolled &&
    css`
      @container toolbar (width > 200px) {
        width: 16.77cqw;
        top: 9.7cqw;
        top: 8.7cqw;
        clip-path: inset(10px 0 4px 0);
      }
    `}

  ${({ isHomePage }) =>
    !isHomePage &&
    css`
      display: none;
    `}
`;

export const navbarTabStyles = (theme: Theme) => css`
  background-color: ${theme.palette.common.black};
  color: ${theme.palette.common.white};
  font-size: calc(var(--sizing-factor) * 1.2cqw) !important;
  line-height: calc(var(--sizing-factor) * 1.2cqw);
  text-align: left;
  border: 0;
  outline: 0;
  user-select: none;
  cursor: pointer;
  font-weight: 700;
  padding: 0;
  border-top-left-radius: 2cqw;
  border-top-right-radius: 2cqw;
  box-sizing: border-box;
  grid-column: 2 / 3;
  display: flex;
  flex-direction: row;
  align-items: flex-start;

  &:hover {
    background-color: ${theme.palette.primary.light};
    color: ${theme.palette.common.black};
  }

  & > * {
    text-decoration: none !important;
    color: inherit !important;
    display: block;
    width: 100%;
    height: 7.2cqw;
    padding: calc(var(--sizing-factor) * 0.75cqw)
      calc(var(--sizing-factor) * 1cqw);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ${theme.breakpoints.up('md')} {
    border-top-left-radius: 1cqw;
    border-top-right-radius: 1cqw;

    & > * {
      height: auto;
    }
  }
`;

const BecomeMemberGoToProfileTab = styled('button')`
  ${navbarTabStyles(theme)}
  grid-column: 2 / 3;
  grid-row: 1 / 2;

  ${theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
`;

const RegisterNewsLetterTab = styled('button')`
  ${navbarTabStyles(theme)}
  grid-column: 1 / 2;
  grid-row: 1 / 2;

  ${theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
  }
`;

const PreTitleTab = styled('div')`
  ${navbarTabStyles(theme)}
  background-color: ${({ theme }) => theme.palette.primary.main};
  grid-column: -1 / 1;
  grid-row: 2 / 3;
  box-sizing: border-box;
  cursor: default;

  &:hover {
    background-color: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.common.white};
  }

  & > * {
    width: unset;
  }

  ${theme.breakpoints.up('md')} {
    grid-column: 1 / 2;
  }
`;

const OpenInvoiceTab = styled('button')`
  ${navbarTabStyles(theme)}
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  background-color: ${({ theme }) => theme.palette.error.main};
  color: ${({ theme }) => theme.palette.common.white};

  &:hover {
    background-color: ${({ theme }) => theme.palette.error.main};
    color: ${({ theme }) => theme.palette.common.white};
  }

  & > * {
    width: unset;
  }

  & > a {
    width: 100%;
  }

  & > svg {
    scale: 1.5;
    margin-right: -3cqw;
  }

  ${theme.breakpoints.up('md')} {
    display: none;
  }
`;

const LoginLogoutTab = styled('button')`
  ${navbarTabStyles(theme)}
  grid-column: 2 / 3;
  grid-row: 1 / 2;

  ${theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
`;

const NavbarTabs = styled('div', {
  shouldForwardProp: propName =>
    propName !== 'navbarState' && propName !== 'isHomePage',
})<{
  navbarState: NavbarState[];
  isHomePage: boolean;
}>`
  display: grid;
  border-bottom: 0.15cqw solid transparent;
  margin: 0 auto;
  align-self: flex-end;
  pointer-events: all;
  grid-column: -1 / 1;
  grid-row: 2 / 3;
  visibility: visible;
  transition: visibility 300ms ease-in-out;
  width: 100%;
  grid-template-columns: repeat(2, calc(50% - 0.5cqw));
  grid-template-rows: 7.2cqw, 0;
  column-gap: 1cqw;
  row-gap: 0.4cqw;

  ${theme.breakpoints.up('md')} {
    grid-template-columns: var(--two-column-grid);
    grid-template-rows: repeat(2, min-content);
    grid-row: 1 / 2;
    grid-column: -1 / 1;
    row-gap: 0.15cqw;
    column-gap: 2.2cqw;
  }

  ${({ navbarState }) => {
    if (navbarState.includes(NavbarState.IsLoggedIn)) {
      return css`
        ${RegisterNewsLetterTab} {
          display: none;
        }
        ${theme.breakpoints.up('md')} {
          ${BecomeMemberGoToProfileTab} {
            grid-row: 2 / 3;
          }
        }
      `;
    }
    if (navbarState.includes(NavbarState.High)) {
      return css`
        ${theme.breakpoints.up('md')} {
          ${RegisterNewsLetterTab} {
            display: none;
          }

          ${BecomeMemberGoToProfileTab} {
            grid-row: 2 / 3;
          }
        }
      `;
    }
  }}

  ${({ isHomePage }) =>
    isHomePage &&
    css`
      row-gap: 0;

      ${theme.breakpoints.up('md')} {
        row-gap: 0.15cqw;
      }

      ${PreTitleTab} {
        display: none;
      }
    `}
`;

const OpenInvoicesAlert = styled('div')`
  position: absolute;
  transform: translateX(100%);
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  grid-template-columns: max-content max-content;
  align-items: center;
  color: ${({ theme }) => theme.palette.error.main};
  font-size: 0.875em;
  font-weight: 600;
  top: 32px;
  right: 54px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    top: 34px;
    right: 56px;
  }
`;

export const NavPaperWrapper = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen: boolean }>`
  padding: ${({ theme }) => `8cqw ${theme.spacing(2)} 0 ${theme.spacing(2)}`};
  background: linear-gradient(
    to bottom,
    color-mix(
      in srgb,
      ${({ theme }) => theme.palette.common.white} 60%,
      ${({ theme }) => theme.palette.primary.main}
    ),
    ${({ theme }) => theme.palette.primary.main}
  );
  color: ${({ theme }) => theme.palette.common.black};
  top: 0;
  left: 0;
  right: 0;
  transform: translate3d(
    0,
    ${({ isMenuOpen }) => (isMenuOpen ? '0' : '-100%')},
    0
  );
  transition: transform 300ms ease-in-out;
  overflow-y: hidden;
  max-height: 100vh;
  z-index: 2;
  height: auto;
  display: grid;
  grid-template-rows: min-content 6cqw;
  row-gap: 12cqw;
  grid-template-columns: 1fr minmax(max-content, 1285px) 1fr;
  position: absolute;

  ${theme.breakpoints.up('md')} {
    row-gap: unset;
    padding-top: 0.5cqw;
  }

  ${NavbarTabs} {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    grid-template-rows: min-content;
    grid-template-columns: var(--two-column-grid-no-gap);
    width: 100%;
    border-bottom: none;

    ${theme.breakpoints.up('md')} {
      column-gap: 0;
    }

    ${LoginLogoutTab} {
      font-size: 1cqw;
      line-height: 1cqw;
      padding: 0;
      border-top-left-radius: 2cqw;
      border-top-right-radius: 2cqw;
      grid-column: -1 / 1;

      & > * {
        width: 100%;
        padding-top: 3cqw;
      }

      ${({ theme }) => theme.breakpoints.up('md')} {
        grid-column: 2 / 3;
        border-top-left-radius: 0.5cqw;
        border-top-right-radius: 0.5cqw;

        & > * {
          padding-top: 0.5cqw;
          height: 1.8cqw;
          width: auto;
          font-size: 0.75cqw;
          line-height: 0.75cqw;
        }
      }
    }
  }
`;

export const NavPaperCategory = styled('div')`
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  row-gap: 0.8cqw;
  padding-left: 2cqw;

  &:nth-of-type(n + 2) {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
  }

  &:nth-of-type(n + 3) {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    padding-left: 0;
    padding-right: 2cqw;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: unset !important;
    grid-row: unset !important;
    padding: 0;
  }
`;

export const NavPaperName = styled('span')`
  text-transform: uppercase;
  font-weight: 300;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  font-size: 3rem !important;
`;

export const NavPaperSeparator = styled('hr')`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.palette.common.white};

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      display: none;
    }
  `}
`;

export const NavPaperLinksGroup = styled('div')`
  display: grid;
  column-gap: 2cqw;
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  grid-template-columns: repeat(2, auto);
  grid-template-rows: repeat(2, auto);
  row-gap: 12cqw;
  margin: 0 0 0 3cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: unset;
    grid-template-rows: unset;
    grid-template-columns: repeat(3, min-content);
  }
`;

export const NavPaperCategoryLinksTitle = styled('h6')`
  color: ${({ theme }) => theme.palette.common.white};
  display: inline-block;
  white-space: nowrap;
  padding: 0 0.3cqw;
  margin: 0;

  font-weight: 700 !important;
  font-size: 4.5cqw !important;
  line-height: 6cqw !important;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-weight: 700 !important;
    font-size: min(1.25cqw, 1.4rem) !important;
    line-height: min(1.66cqw, 1.86rem) !important;
  }
`;

export const NavPaperCategoryLinks = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  font-weight: 700 !important;
  font-size: 4.5cqw !important;
  line-height: 6cqw !important;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-weight: 700 !important;
    font-size: min(1.25cqw, 1.4rem) !important;
    line-height: min(1.66cqw, 1.86rem) !important;
  }
`;

export const NavPaperCategoryLinkItem = styled('li')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const CategoryLink = styled(Link)`
  color: inherit;
  display: inline-block;
  white-space: nowrap;
  padding: 0 0.3cqw;
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.palette.primary.light};
    text-decoration: none;
  }
`;

export const NavPaperMainLinks = styled(NavPaperCategoryLinks)`
  gap: 0;

  span {
    font-family: inherhit;
  }
  display: none;
`;

export const NavPaperChildrenWrapper = styled('div')`
  position: relative;
  padding: ${({ theme }) => theme.spacing(1.5)};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  justify-items: center;
  width: 100%;

  ${({ theme }) => theme.breakpoints.up('md')} {
    position: absolute;
    grid-template-columns: auto;
    justify-items: start;
    width: calc(100% / 6);
    gap: ${({ theme }) => theme.spacing(3)};
    padding-top: ${({ theme }) => theme.spacing(10)};
    padding-left: ${({ theme }) => theme.spacing(2)};
  }
`;

export const NavPaperActions = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(5)};
`;

export const categoryLinkComponent = styled('span')`
  font-weight: 700 !important;
  font-size: 1.675cqw !important;
  line-height: 2.2cqw !important;
`;

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
  children,
}: PropsWithChildren<{
  loginBtn?: ButtonProps | null;
  profileBtn?: ButtonProps | null;
  subscribeBtn?: ButtonProps | null;
  main: FullNavigationFragment | null | undefined;
  categories: FullNavigationFragment[][];
  closeMenu: () => void;
  hasRunningSubscription: boolean;
  hasUnpaidInvoices: boolean;
  isMenuOpen: boolean;
  className?: string;
}>) => {
  const {
    elements: { Link, H6 },
  } = useWebsiteBuilder();
  const { hasUser, logout } = useUser();
  const router = useRouter();

  return (
    <NavPaperWrapper
      isMenuOpen={isMenuOpen}
      className={`${className || ''} ${isMenuOpen ? 'menu-open' : ''}`.trim()}
    >
      {!!categories.length &&
        categories.map((categoryArray, arrayIndex) => (
          <NavPaperLinksGroup key={arrayIndex}>
            {arrayIndex > 0 && <NavPaperSeparator />}

            {categoryArray.map(nav => (
              <NavPaperCategory key={nav.id}>
                <H6 component={NavPaperCategoryLinksTitle}>{nav.name}</H6>
                <NavPaperCategoryLinks>
                  {nav.links?.map((link, index) => {
                    const url = navigationLinkToUrl(link);

                    return (
                      <NavPaperCategoryLinkItem key={index}>
                        <CategoryLink
                          href={url}
                          onClick={closeMenu}
                        >
                          {link.label}
                        </CategoryLink>
                      </NavPaperCategoryLinkItem>
                    );
                  })}
                </NavPaperCategoryLinks>
              </NavPaperCategory>
            ))}
          </NavPaperLinksGroup>
        ))}
      <NavbarTabs
        navbarState={[]}
        isHomePage={false}
      >
        <LoginLogoutTab>
          {hasUser && (
            <Link
              onClick={() => {
                logout();
                closeMenu();
              }}
              href={router.asPath}
            >
              Logout
            </Link>
          )}
          {!hasUser && loginBtn && (
            <Link
              href={loginBtn.href}
              onClick={closeMenu}
            >
              Login
            </Link>
          )}
        </LoginLogoutTab>
      </NavbarTabs>
    </NavPaperWrapper>
  );
};

export const NavbarInnerWrapper = styled(Toolbar, {
  shouldForwardProp: propName =>
    propName !== 'navbarState' && propName !== 'isMenuOpen',
})<{
  navbarState: NavbarState[];
  isMenuOpen?: boolean;
}>`
  min-height: unset !important;
  margin: 0 auto;
  width: 100%;
  background-color: ${({ theme }) => theme.palette.common.white};
  max-width: 1333px;
  container: toolbar/inline-size;
  position: static;
  box-sizing: border-box;
  aspect-ratio: var(--changing-aspect-ratio) !important;
  display: grid;
  grid-template-columns: 1fr min-content min-content;
  grid-template-rows: repeat(2, auto);
  transition:
    background-color 100ms ease-out 200ms,
    aspect-ratio 300ms ease-out;

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      background-color: transparent;
      pointer-events: none;

      ${NavbarLoginLink} {
        visibility: hidden;
      }
      ${NavbarTabs} {
        visibility: hidden;
      }
    `}

  ${theme.breakpoints.up('md')} {
    grid-template-rows: unset;
  }
`;

const buttonStyles: SxProps<Theme> = theme => ({
  [theme.breakpoints.up('xs')]: {
    fontSize: `calc(${theme.typography.button.fontSize} * 1.1)`,
    padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
    textWrap: 'nowrap',
    '&:hover': {
      boxShadow: '5px 5px 7px rgba(0, 0, 0, 0.6);',
    },
  },
});

export interface ExtendedNavbarProps extends BuilderNavbarProps {
  isMenuOpen?: boolean;
  onMenuToggle?: (isOpen: boolean) => void;
  navPaperClassName?: string;
}

export const TsriV2Navbar = forwardRef<HTMLElement, ExtendedNavbarProps>(
  function TsriV2Navbar(
    {
      className,
      children,
      categorySlugs,
      slug,
      headerSlug,
      iconSlug,
      data,
      hasRunningSubscription,
      hasUnpaidInvoices,
      loginBtn = { href: '/login' },
      profileBtn = { href: '/profile' },
      subscribeBtn = { href: '/mitmachen' },
      isMenuOpen: controlledIsMenuOpen,
      onMenuToggle,
      navPaperClassName,
      pageTypeBasedProps,
      imagesBase64 = {},
    }: ExtendedNavbarProps,
    forwardRef
  ) {
    const ref = useRef<HTMLElement>(null);

    const [internalIsMenuOpen, setInternalMenuOpen] = useState(false);

    const [isScrolled, setIsScrolled] = useState(false);
    const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(
      ScrollDirection.Down
    );
    const lastScrollY = useRef(0);
    const hasActiveSubscription = useHasActiveSubscription();

    const isMenuOpen =
      controlledIsMenuOpen !== undefined ? controlledIsMenuOpen : (
        internalIsMenuOpen
      );

    const handleScroll = useCallback(
      (...args: any) => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY.current) {
          if (scrollDirection !== ScrollDirection.Down) {
            setScrollDirection(ScrollDirection.Down);
          }
        } else if (currentScrollY < lastScrollY.current) {
          if (scrollDirection !== ScrollDirection.Up) {
            setScrollDirection(ScrollDirection.Up);
          }
        }

        const newIsScrolled = currentScrollY > 1;

        if (newIsScrolled !== isScrolled) {
          setIsScrolled(newIsScrolled);
        }

        lastScrollY.current = currentScrollY;
      },
      [isScrolled, scrollDirection]
    );

    const toggleMenu = useCallback(() => {
      const newState = !isMenuOpen;

      if (controlledIsMenuOpen === undefined) {
        setInternalMenuOpen(newState);
      }

      onMenuToggle?.(newState);
    }, [isMenuOpen, controlledIsMenuOpen, onMenuToggle]);

    const { t } = useTranslation();

    const { hasUser, logout } = useUser();

    const {
      elements: { Link, Button },
    } = useWebsiteBuilder();

    const router = useRouter();

    const tabText = useMemo(() => {
      //console.log('pageTypeBasedProps', pageTypeBasedProps);
      if (pageTypeBasedProps) {
        switch (pageTypeBasedProps.pageType) {
          case PageType.Article:
            return pageTypeBasedProps.Article?.preTitle || '';
          case PageType.Author:
            return 'Ich bin Tsüri!';
          case PageType.AuthorList:
            return 'Mir sind Tsüri!';
          case PageType.SearchPage:
            return 'Suche';
          case PageType.SubscriptionPage:
            return 'Jetzt Tsüri unterstützen!';
          case PageType.ArticleList:
            return capitalize(pageTypeBasedProps.ArticleList?.tag || '');
          case PageType.EventList:
            return 'Unsere Events';
          case PageType.Profile:
            return 'Verwalte dein Konto, deine Abos und Rechnungen';
          case PageType.Login:
            return 'Melde dich in deinem Konto an';
        }
      }
      return '';
    }, [pageTypeBasedProps]);

    const mainItems = data?.navigations?.find(({ key }) => key === slug);
    const iconItems = data?.navigations?.find(({ key }) => key === iconSlug);

    const categories = useMemo(() => {
      return categorySlugs.map(categorySlugArray =>
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
    }, [categorySlugs, data?.navigations]);

    useEffect(() => {
      lastScrollY.current = window.scrollY;
      window.addEventListener('scroll', handleScroll);

      return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const navbarState = getNavbarState(
      isScrolled,
      scrollDirection,
      hasActiveSubscription,
      (!hasRunningSubscription && !hasUnpaidInvoices && subscribeBtn) as boolean
    );

    const isHomePage = pageTypeBasedProps?.Page?.slug === '';

    const navbarStyles = useMemo(
      () => cssVariables(navbarState, isHomePage),
      [navbarState, isHomePage]
    );

    useImperativeHandle(forwardRef, () => ref.current!, []);

    useEffect(() => {
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
          handleResize();
        });

        if (!ref.current) {
          return;
        }

        observer.observe(ref.current);

        return () =>
          ref?.current ? observer.unobserve(ref.current) : undefined;
      }

      window.addEventListener('resize', handleResize);

      return () => window.removeEventListener('resize', handleResize);
    }, [ref]);

    function handleResize() {
      if (ref?.current) {
        ref.current.ownerDocument.documentElement.setAttribute(
          'style',
          `--navbar-height: ${ref.current.getBoundingClientRect().height}px`
        );
      }
    }

    return (
      <NavbarWrapper
        ref={ref}
        className={className}
      >
        <GlobalStyles styles={navbarStyles} />
        <AppBar
          isMenuOpen={isMenuOpen}
          elevation={0}
        >
          <NavbarInnerWrapper
            navbarState={navbarState}
            isMenuOpen={isMenuOpen}
          >
            <NavbarLoginLink
              href="/"
              aria-label="Startseite"
            >
              <TsriLogo
                src={
                  isHomePage ?
                    imagesBase64?.logoDefault ?
                      imagesBase64.logoDefault
                    : '/logo.svg'
                  : imagesBase64?.logoAlternative ?
                    imagesBase64.logoAlternative
                  : '/logo_blue.svg'
                }
                alt="Tsüri"
                isScrolled={isScrolled}
                isHomePage={isHomePage}
              />
              <TsriClaim
                src={imagesBase64?.claim ? imagesBase64.claim : '/claim.gif'}
                alt="Unabhängig, Kritisch, Lokal."
                isScrolled={isScrolled}
                isHomePage={isHomePage}
              />
            </NavbarLoginLink>

            <NavbarActions isMenuOpen={isMenuOpen}>
              {hasUnpaidInvoices && profileBtn && (
                <Button
                  LinkComponent={Link}
                  color="error"
                  startIcon={<MdWarning />}
                  sx={buttonStyles}
                  size="medium"
                  {...profileBtn}
                  onClick={() => {
                    if (controlledIsMenuOpen === undefined) {
                      setInternalMenuOpen(false);
                    }
                    onMenuToggle?.(false);
                  }}
                >
                  <Box sx={{ display: { xs: 'none', md: 'unset' } }}>
                    Offene
                  </Box>
                  &nbsp;Rechnung
                </Button>
              )}
            </NavbarActions>

            <NavbarMain isMenuOpen={isMenuOpen}>
              <NavbarInstaButton
                size="small"
                aria-label="Instagram"
                title="Instagram"
                color={'inherit'}
                onClick={() => {
                  if (controlledIsMenuOpen === undefined) {
                    setInternalMenuOpen(false);
                  }
                  onMenuToggle?.(false);
                  router.push('https://www.instagram.com/tsri.ch/');
                }}
              >
                <FiInstagram />
              </NavbarInstaButton>
              <NavbarSearchButton
                size="small"
                aria-label="Suche"
                title="Suche"
                color={'inherit'}
                onClick={() => {
                  if (controlledIsMenuOpen === undefined) {
                    setInternalMenuOpen(false);
                  }
                  onMenuToggle?.(false);
                  router.push('/search');
                }}
              >
                <FiSearch />
              </NavbarSearchButton>

              <NavbarHamburgerButton
                size="small"
                aria-label="Menu"
                title="Menu"
                onClick={toggleMenu}
                color={'inherit'}
              >
                <FiMenu />
                {hasUnpaidInvoices && profileBtn && (
                  <OpenInvoicesAlert>
                    <MdWarning size={24} />
                  </OpenInvoicesAlert>
                )}
              </NavbarHamburgerButton>
            </NavbarMain>

            <NavbarTabs
              navbarState={navbarState}
              isHomePage={isHomePage}
            >
              <PreTitleTab>
                <span>{tabText}</span>
              </PreTitleTab>

              <BecomeMemberGoToProfileTab>
                {!hasUser &&
                  !hasRunningSubscription &&
                  !hasUnpaidInvoices &&
                  subscribeBtn && (
                    <Link href={subscribeBtn.href}>
                      {t('navbar.subscribe')}
                    </Link>
                  )}
                {hasUser && profileBtn && (
                  <Link href={profileBtn.href}>Mein Konto</Link>
                )}
              </BecomeMemberGoToProfileTab>

              {hasUnpaidInvoices && profileBtn && (
                <OpenInvoiceTab>
                  <MdWarning size={24} />
                  <Link
                    href={profileBtn.href}
                    onClick={() => {
                      if (controlledIsMenuOpen === undefined) {
                        setInternalMenuOpen(false);
                      }
                      onMenuToggle?.(false);
                    }}
                  >
                    Offene Rechnung
                  </Link>
                </OpenInvoiceTab>
              )}

              <RegisterNewsLetterTab>
                <Link href="/newsletter?mc_u=56ee24de7341c744008a13c9e&mc_id=32c65d081a&mc_f_id=00e5c2e1f0&source=tsri&tf_id=jExhxiVv&popTitle=DAS%20WICHTIGSTE%20AUS%20ZÜRI&popButtonText=Jetzt%20kostenlos%20abonnieren!&popText=Jeden%20Morgen%20findest%20du%20im%20Z%C3%BCri%20Briefing%20kuratierte%20News,%20Geschichten%20und%20Tipps%20f%C3%BCr%20den%20Tag.%20Bereits%2029'000%20Menschen%20lesen%20mit%20%E2%80%93%20und%20du?">
                  Newsletter kostenlos abonnieren
                </Link>
              </RegisterNewsLetterTab>
            </NavbarTabs>
          </NavbarInnerWrapper>

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
              className={navPaperClassName}
            >
              {iconItems?.links.map((link, index) => (
                <Link
                  key={index}
                  href={navigationLinkToUrl(link)}
                  onClick={() => {
                    if (controlledIsMenuOpen === undefined) {
                      setInternalMenuOpen(false);
                    }

                    onMenuToggle?.(false);
                  }}
                  color="inherit"
                >
                  <TextToIcon
                    title={link.label}
                    size={32}
                  />
                </Link>
              ))}

              {children}
            </NavPaper>
          )}
        </AppBar>
      </NavbarWrapper>
    );
  }
);
