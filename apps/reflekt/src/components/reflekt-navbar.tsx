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
  Typography,
} from '@mui/material';
import { useUser } from '@wepublish/authentication/website';
import { useHasActiveSubscription } from '@wepublish/membership/website';
import { navigationLinkToUrl } from '@wepublish/navigation/website';
import { ButtonProps } from '@wepublish/ui';
import { FullNavigationFragment } from '@wepublish/website/api';
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
  background-color: ${theme.palette.common.white};
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
  margin-bottom: calc(${theme.spacing(-3)} + 1px);
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

  position: absolute;
  right: 3rem;

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

export const NavbarHomeLink = styled(Link)`
  color: unset;
  position: relative;
  grid-column: 1 / 2;
  grid-row: -1 / 1;
  align-self: flex-start;
  display: grid;
  align-items: center;
  justify-items: center;
  justify-self: left;
`;

const ReflektLogo = styled('img', {
  shouldForwardProp: propName =>
    propName !== 'isScrolled' && propName !== 'isHomePage',
})<{ isScrolled?: boolean; isHomePage?: boolean }>`
  transition: width 300ms ease-out;
  transform: translate3d(0, 0, 0);
  position: absolute;

  width: 10rem;
  height: auto;
  top: 2rem;
  left: 2rem;

  ${theme.breakpoints.up('md')} {
    width: 10rem;

    // scrolled
    ${({ isScrolled }) =>
      isScrolled &&
      css`
        width: 10rem;
      `}

    // on home page, not scrolled
    ${({ isHomePage }) =>
      isHomePage &&
      css`
        width: 10rem;
      `}

      // on home page, scrolled
    ${({ isScrolled, isHomePage }) =>
      isHomePage &&
      isScrolled &&
      css`
        width: 10rem;
      `}
  }
`;

const BecomeMemberGoToProfileTab = styled(Link)`
  grid-column: 2 / 3;
  grid-row: 1 / 2;

  ${theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
`;

const RegisterNewsLetterTab = styled(Link)`
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  display: block;
  width: 50cqw;

  ${theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    width: unset;
  }
`;

const PreTitleTab = styled('div')`
  grid-column: -1 / 1;
  grid-row: 2 / 3;
  background-color: ${theme.palette.primary.main};
  color: ${theme.palette.common.white};
  font-size: calc(var(--sizing-factor) * 1.2cqw);
  line-height: calc(var(--sizing-factor) * 1.2cqw);
  font-weight: 700;
  padding: calc(var(--sizing-factor) * 0.75cqw)
    calc(var(--sizing-factor) * 1cqw);
  border-top-left-radius: 2cqw;
  border-top-right-radius: 2cqw;

  ${theme.breakpoints.up('md')} {
    grid-column: 1 / 2;
    border-top-left-radius: 1cqw;
    border-top-right-radius: 1cqw;
  }
`;

const OpenInvoiceTab = styled(Link)`
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  background-color: ${theme.palette.error.main};
  color: ${theme.palette.common.white};

  &:hover {
    background-color: ${theme.palette.error.main};
    color: ${theme.palette.common.white};
  }

  & > svg {
    scale: 1.25;
    margin-right: 2cqw;
  }

  ${theme.breakpoints.up('md')} {
    display: none;
  }
`;

const LoginLogoutTab = styled(Link)`
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
  gap: ${theme.spacing(0.5)};
  grid-template-columns: max-content max-content;
  align-items: center;
  color: ${theme.palette.error.main};
  font-size: 1cqw;
  font-weight: 600;
  top: 66%;
  right: 111%;
`;

const MdWarningOIA = styled(MdWarning)`
  font-size: 6cqw;

  ${theme.breakpoints.up('md')} {
    font-size: 2cqw;
  }
`;

export const NavPaperWrapper = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen: boolean }>`
  padding: 8cqw ${theme.spacing(2)} 0 ${theme.spacing(2)};
  background: ${theme.palette.primary.main};
  color: ${theme.palette.common.white};
  top: 0;
  left: 0;
  right: 0;
  transform: translate3d(
    0,
    ${({ isMenuOpen }) => (isMenuOpen ? '0' : '-102%')},
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
      grid-column: -1 / 1;

      ${theme.breakpoints.up('md')} {
        grid-column: 2 / 3;
        border-top-left-radius: 0.8cqw;
        border-top-right-radius: 0.8cqw;
      }

      ${theme.breakpoints.up('xl')} {
        padding: 0.25cqw 1cqw;
        font-size: 0.85cqw;
        border-top-left-radius: 0.5cqw;
        border-top-right-radius: 0.5cqw;
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

  ${theme.breakpoints.up('md')} {
    &:nth-of-type(n) {
      grid-column: unset;
      grid-row: unset;
      padding: 0;
    }
  }
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

  ${theme.breakpoints.up('md')} {
    row-gap: unset;
    grid-template-rows: unset;
    grid-template-columns: repeat(3, min-content);
  }
`;

const NavPaper = ({
  categories,
  loginBtn,
  closeMenu,
  isMenuOpen,
  className,
}: PropsWithChildren<{
  loginBtn?: ButtonProps | null;
  main: FullNavigationFragment | null | undefined;
  categories: FullNavigationFragment[][];
  closeMenu: () => void;
  isMenuOpen: boolean;
  className?: string;
}>) => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();
  const { hasUser, logout } = useUser();

  return (
    <NavPaperWrapper
      isMenuOpen={isMenuOpen}
      className={`${className || ''} ${isMenuOpen ? 'menu-open' : ''}`.trim()}
    >
      {!!categories.length &&
        categories.map((categoryArray, arrayIndex) => (
          <NavPaperLinksGroup key={arrayIndex}>
            {categoryArray.map(nav => (
              <NavPaperCategory key={nav.id}>
                <Typography variant="categoryLinkList">
                  {nav.links?.map((link, index) => {
                    return (
                      <Typography
                        variant="categoryLinkItem"
                        key={index}
                      >
                        <Link
                          variant={'categoryLink'}
                          href={navigationLinkToUrl(link)}
                          onClick={closeMenu}
                        >
                          {link.label}
                        </Link>
                      </Typography>
                    );
                  })}
                </Typography>
              </NavPaperCategory>
            ))}
          </NavPaperLinksGroup>
        ))}
      <NavbarTabs
        navbarState={[]}
        isHomePage={false}
      >
        {hasUser && (
          <LoginLogoutTab
            variant="navbarTab"
            onClick={() => {
              logout();
              closeMenu();
            }}
          >
            Logout
          </LoginLogoutTab>
        )}
        {!hasUser && loginBtn && (
          <LoginLogoutTab
            variant="navbarTab"
            onClick={() => {
              closeMenu();
            }}
            href={loginBtn.href}
          >
            Login
          </LoginLogoutTab>
        )}
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
  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      background-color: transparent;
      pointer-events: none;

      ${NavbarHomeLink} {
        visibility: hidden;
      }
      ${NavbarTabs} {
        visibility: hidden;
      }
    `}
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

export const ReflektNavbar = forwardRef<HTMLElement, ExtendedNavbarProps>(
  function ReflektNavbar(
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

    const { hasUser } = useUser();

    const {
      elements: { Link, Button },
    } = useWebsiteBuilder();

    const router = useRouter();

    const mainItems = data?.navigations?.find(({ key }) => key === slug);

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

    const isHomePage = router.pathname === '/';

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
            //variant="navbarInnerWrapper"
            navbarState={navbarState}
            isMenuOpen={isMenuOpen}
          >
            <NavbarHomeLink
              href="/"
              aria-label="Startseite"
            >
              <ReflektLogo
                src={'/logo_desktop.svg'}
                alt="Reflekt Logo"
                isScrolled={isScrolled}
                isHomePage={isHomePage}
              />
            </NavbarHomeLink>

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
                    <MdWarningOIA />
                  </OpenInvoicesAlert>
                )}
              </NavbarHamburgerButton>
            </NavbarMain>

            <NavbarTabs
              navbarState={navbarState}
              isHomePage={isHomePage}
            >
              {!hasUser &&
                !hasRunningSubscription &&
                !hasUnpaidInvoices &&
                subscribeBtn && (
                  <BecomeMemberGoToProfileTab
                    variant="navbarTab"
                    href={subscribeBtn.href}
                  >
                    {t('navbar.subscribe')}
                  </BecomeMemberGoToProfileTab>
                )}
              {hasUser && profileBtn && (
                <BecomeMemberGoToProfileTab
                  variant="navbarTab"
                  href={profileBtn.href}
                >
                  Mein Konto
                </BecomeMemberGoToProfileTab>
              )}

              {hasUnpaidInvoices && profileBtn && (
                <OpenInvoiceTab
                  variant="navbarTab"
                  href={profileBtn.href}
                  onClick={() => {
                    if (controlledIsMenuOpen === undefined) {
                      setInternalMenuOpen(false);
                    }
                    onMenuToggle?.(false);
                  }}
                >
                  <MdWarning
                    size={12}
                    style={{ verticalAlign: 'middle' }}
                  />
                  <span>Offene Rechnung</span>
                </OpenInvoiceTab>
              )}

              <RegisterNewsLetterTab
                variant="navbarTab"
                href="/newsletter?mc_u=56ee24de7341c744008a13c9e&mc_id=32c65d081a&mc_f_id=00e5c2e1f0&source=tsri&tf_id=jExhxiVv&popTitle=DAS%20WICHTIGSTE%20AUS%20ZÜRI&popButtonText=Jetzt%20kostenlos%20abonnieren!&popText=Jeden%20Morgen%20findest%20du%20im%20Z%C3%BCri%20Briefing%20kuratierte%20News,%20Geschichten%20und%20Tipps%20f%C3%BCr%20den%20Tag.%20Bereits%2029'000%20Menschen%20lesen%20mit%20%E2%80%93%20und%20du?"
              >
                Newsletter kostenlos abonnieren
              </RegisterNewsLetterTab>
            </NavbarTabs>
          </NavbarInnerWrapper>

          {Boolean(mainItems || categories?.length) && (
            <NavPaper
              loginBtn={loginBtn}
              main={mainItems}
              categories={categories}
              closeMenu={toggleMenu}
              isMenuOpen={isMenuOpen}
              className={navPaperClassName}
            >
              {children}
            </NavPaper>
          )}
        </AppBar>
      </NavbarWrapper>
    );
  }
);
