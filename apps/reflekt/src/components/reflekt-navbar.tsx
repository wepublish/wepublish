import styled from '@emotion/styled';
import {
  AppBar as MuiAppBar,
  Box,
  css,
  GlobalStyles,
  SxProps,
  Theme,
  Toolbar,
  Typography,
} from '@mui/material';
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
import { FiMenu as FiMenuDefault } from 'react-icons/fi';
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
  overflow-y: visible;

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

  > * {
    pointer-events: all;
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

export const NavbarHamburgerButton = styled(IconButton, {
  shouldForwardProp: propName =>
    propName !== 'isMenuOpen' && propName !== 'isTransitioning',
})<{ isMenuOpen: boolean; isTransitioning: boolean }>`
  background-color: ${theme.palette.primary.main};
  width: 5rem;
  height: 5rem;
  border-radius: 0;
  transition: transform 100ms ease-out;
  position: relative;
  transform-origin: top left;

  &:hover {
    ${({ isTransitioning }) => {
      if (isTransitioning) {
        return '';
      }

      return css`
        transform: scale(1.05);
      `;
    }}
    background-color: ${theme.palette.primary.main};
  }

  ${({ isMenuOpen }) =>
    isMenuOpen ?
      css`
        transform: scale(1.05);
      `
    : ''}

  & > span {
    position: absolute;
    left: 25%;
    top: 50%;
    width: 32px;
    height: 3px;
    background-color: ${theme.palette.common.white};
    transition: all 300ms cubic-bezier(0.84, 0.06, 0.52, 1.8);
    transition: all 300ms ease-out;
    opacity: 1;
  }

  & > span:nth-of-type(1) {
    transform: translateY(-8px);
    animation-delay: 100ms;
  }

  & > span:nth-of-type(3) {
    transform: translateY(8px);
    animation-delay: 250ms;
  }
  ${({ isMenuOpen }) =>
    isMenuOpen ?
      css`
        transform: scale(1.05);
        & > span:nth-of-type(1) {
          transform: rotate(40deg);
        }
        & > span:nth-of-type(2) {
          transform: rotate(-40deg);
        }
        & > span:nth-of-type(3) {
          opacity: 0;
        }
      `
    : ''}
`;

export const NavbarSearchButton = styled(IconButton)`
  ${navbarButtonStyles(theme)}
`;

export const NavbarIconButtonWrapper = styled('div')``;

export const NavbarMain = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen?: boolean }>`
  grid-column: -1 / 1;
  grid-row: 1 / 2;
  margin: 0 0 0 ${({ theme }) => theme.spacing(-3)};
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
    opacity: 1;
    transition: opacity 250ms ease-in-out;
  }
`;

export const NavPaperWrapper = styled('div', {
  shouldForwardProp: propName =>
    propName !== 'isMenuOpen' && propName !== 'isTransitioning',
})<{ isMenuOpen: boolean; isTransitioning: boolean }>`
  padding: 8cqw ${theme.spacing(2)} 0 ${theme.spacing(2)};
  background: ${theme.palette.primary.main};
  color: ${theme.palette.common.white};
  top: 0;
  left: 0;
  right: 0;
  transform: scale(${({ isMenuOpen }) => (isMenuOpen ? '100%' : '3%')});
  transform-origin: top left;
  transition: transform 300ms cubic-bezier(0.62, 0.04, 0.3, 1.56);
  transition: transform 300ms ease-out;
  transition-delay: ${({ isMenuOpen }) => (isMenuOpen ? '0ms' : '100ms')};
  overflow-y: hidden;
  z-index: 2;
  height: 100vh;
  width: 100%;
  display: grid;
  grid-template-rows: min-content 6cqw;
  row-gap: 12cqw;
  grid-template-columns: 1fr minmax(max-content, 1285px) 1fr;
  position: absolute;

  ${theme.breakpoints.up('md')} {
    row-gap: unset;
    padding-top: 0.5cqw;
  }

  ${NavPaperLinksGroup} {
    ${({ isTransitioning, isMenuOpen }) =>
      isTransitioning && !isMenuOpen ?
        css`
          opacity: 0;
        `
      : ''}
  }
`;

const NavPaper = ({
  categories,
  loginBtn,
  closeMenu,
  isMenuOpen,
  isTransitioning,
  className,
}: PropsWithChildren<{
  loginBtn?: ButtonProps | null;
  main: FullNavigationFragment | null | undefined;
  categories: FullNavigationFragment[][];
  closeMenu: () => void;
  isMenuOpen: boolean;
  isTransitioning: boolean;
  className?: string;
}>) => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();

  return (
    <NavPaperWrapper
      isMenuOpen={isMenuOpen}
      isTransitioning={isTransitioning}
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
    const [isTransitioning, setIsTransitioning] = useState(false);

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
      setIsTransitioning(true);

      if (controlledIsMenuOpen === undefined) {
        setInternalMenuOpen(newState);
      }

      onMenuToggle?.(newState);
    }, [isMenuOpen, controlledIsMenuOpen, onMenuToggle]);

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
            <NavbarMain isMenuOpen={isMenuOpen}>
              <NavbarHamburgerButton
                isMenuOpen={isMenuOpen}
                isTransitioning={isTransitioning}
                size="small"
                aria-label="Menu"
                title="Menu"
                onClick={toggleMenu}
                onMouseLeave={() => {
                  setTimeout(() => setIsTransitioning(false), 300);
                }}
                disableRipple={true}
              >
                <span></span>
                <span></span>
                <span></span>
                {hasUnpaidInvoices && profileBtn && (
                  <OpenInvoicesAlert>
                    <MdWarningOIA />
                  </OpenInvoicesAlert>
                )}
              </NavbarHamburgerButton>
            </NavbarMain>

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

              {!hasRunningSubscription && subscribeBtn && (
                <Button
                  variant="cta-black"
                  LinkComponent={Link}
                  size="medium"
                  sx={buttonStyles}
                  {...subscribeBtn}
                >
                  Unterstützen
                </Button>
              )}
            </NavbarActions>
          </NavbarInnerWrapper>

          {Boolean(mainItems || categories?.length) && (
            <NavPaper
              loginBtn={loginBtn}
              main={mainItems}
              categories={categories}
              closeMenu={toggleMenu}
              isMenuOpen={isMenuOpen}
              isTransitioning={isTransitioning}
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
