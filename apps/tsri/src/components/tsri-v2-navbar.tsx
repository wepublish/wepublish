import styled from '@emotion/styled';
import {
  AppBar as MuiAppBar,
  Box,
  css,
  GlobalStyles,
  Theme,
  Toolbar,
  useTheme,
} from '@mui/material';
import { useUser } from '@wepublish/authentication/website';
import { forceHideBanner } from '@wepublish/banner/website';
import { useHasActiveSubscription } from '@wepublish/membership/website';
import { navigationLinkToUrl } from '@wepublish/navigation/website';
import { ButtonProps, TextToIcon } from '@wepublish/ui';
import { FullNavigationFragment } from '@wepublish/website/api';
import { PageType } from '@wepublish/website/builder';
import {
  BuilderNavbarProps,
  IconButton,
  Link,
  PageTypeBasedProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiPlus, FiSearch } from 'react-icons/fi';
import { MdWarning } from 'react-icons/md';
enum NavbarState {
  Low,
  High,
}

enum ScrollDirection {
  Up,
  Down,
}

const cssVariables = (state: NavbarState[], isHomePage: boolean) => css`
  :root {
    ${isHomePage ?
      `
    --navbar-aspect-ratio: 6.5 / 1;
    --scrolled-navbar-aspect-ratio: 9 / 1;
    `
    : `
    --navbar-aspect-ratio: 8 / 1;
    --scrolled-navbar-aspect-ratio: 9.5 / 1;
    `}
    --changing-aspect-ratio: ${state.includes(NavbarState.Low) ?
      'var(--navbar-aspect-ratio)'
    : 'var(--scrolled-navbar-aspect-ratio)'};
  }
`;

export const AppBar = styled(MuiAppBar)`
  background-color: white;
`;

export const NavbarWrapper = styled('nav')`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  height: auto;
  pointer-events: none;

  > * {
    pointer-events: all;
  }
`;

const getNavbarState = (
  isScrolled: boolean,
  scrollDirection: ScrollDirection,
  isMenuOpen: boolean,
  hasActiveSubscription: boolean
): NavbarState[] => {
  if (isMenuOpen || !isScrolled) {
    return [NavbarState.Low];
  }

  if (hasActiveSubscription) {
    if (scrollDirection === ScrollDirection.Down) {
      return [NavbarState.Low];
    }
  }

  return [NavbarState.High];
};

export const NavbarInnerWrapper = styled(Toolbar, {
  shouldForwardProp: propName => propName !== 'navbarState',
})<{
  navbarState: NavbarState[];
}>`
  min-height: unset;
  margin: 0 auto;
  width: 100%;
  background-color: ${({ theme }) => theme.palette.background.paper};
  transform: translate3d(0, 0, 0);
  transition: aspect-ratio 300ms ease-out;
  max-width: 1333px;
  container: toolbar/inline-size;
  position: relative;
  box-sizing: border-box;
  aspect-ratio: var(--changing-aspect-ratio) !important;
`;

export const NavbarMain = styled('div')<{ isMenuOpen?: boolean }>`
  position: absolute;
  @container toolbar (width > 200px) {
    top: 1.3cqw;
    right: 2.5cqw;
    column-gap: 0.9cqw;
  }
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: center;
  justify-self: end;

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}
`;

export const NavbarHamburgerButton = styled(IconButton)`
  padding: 0;
  background-color: black;
  border-radius: 50%;
  @container toolbar (width > 200px) {
    width: 3.917442cqw;
    height: 3.917442cqw;
  }
  > svg {
    stroke-width: 1.25px;
    stroke: white;
    font-size: 2.5cqw;
  }
  &:hover {
    background-color: #f5ff64;
    > svg {
      stroke: black;
    }
  }
`;

export const NavbarSearchButton = styled(IconButton)`
  padding: 0;
  background-color: black;
  border-radius: 50%;
  @container toolbar (width > 200px) {
    width: 3.917442cqw;
    height: 3.917442cqw;
  }
  > svg {
    stroke-width: 1.25px;
    stroke: white;
    font-size: 2.5cqw;
  }
  &:hover {
    background-color: #f5ff64;
    > svg {
      stroke: black;
    }
  }
`;

export const NavbarIconButtonWrapper = styled('div')`
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1;
`;

export const NavbarActions = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen?: boolean }>`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-self: end;
  gap: 1cqw;
  justify-self: end;

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}
`;

export const NavbarLoginLink = styled(Link, {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen: boolean }>`
  color: unset;
  display: grid;
  align-items: center;
  justify-items: center;
  justify-self: left;

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}
`;

const TsriLogo = styled('img', {
  shouldForwardProp: propName =>
    propName !== 'isScrolled' &&
    propName !== 'isMenuOpen' &&
    propName !== 'isHomePage',
})<{ isScrolled?: boolean; isMenuOpen?: boolean; isHomePage?: boolean }>`
  transition: width 300ms ease-out;
  transform: translate3d(0, 0, 0);
  position: absolute;

  // not scrolled --> blue logo, larger
  @container toolbar (width > 200px) {
    width: 24.2cqw;
    height: auto;
    top: 0.5cqw;
    left: 2cqw;
  }

  // scrolled --> blue logo, smaller
  ${({ isScrolled, isMenuOpen }) =>
    isScrolled &&
    !isMenuOpen &&
    css`
      @container toolbar (width > 200px) {
        width: 18.6cqw;
      }
    `}

  // on home page, not scrolled --> black logo, larger
  ${({ isHomePage }) =>
    isHomePage &&
    css`
      @container toolbar (width > 200px) {
        width: 32.55cqw;
      }
    `}

  // on home page, scrolled --> black logo, smaller
  ${({ isScrolled, isMenuOpen, isHomePage }) =>
    isHomePage &&
    isScrolled &&
    !isMenuOpen &&
    css`
      @container toolbar (width > 200px) {
        //width: 23.3cqw;
        //width: 18.6cqw;
        width: 21cqw;
      }
    `}
`;

const TsriClaim = styled('img', {
  shouldForwardProp: propName =>
    propName !== 'isScrolled' &&
    propName !== 'isMenuOpen' &&
    propName !== 'isHomePage',
})<{ isScrolled?: boolean; isMenuOpen?: boolean; isHomePage?: boolean }>`
  transition:
    width 300ms ease-out,
    top 300ms ease-out;
  transform: translate3d(0, 0, 0);
  position: absolute;

  @container toolbar (width > 200px) {
    width: 26cqw;
    height: auto;
    top: 13.5cqw;
    left: 2cqw;
  }

  ${({ theme, isScrolled, isMenuOpen }) =>
    isScrolled &&
    !isMenuOpen &&
    css`
      @container toolbar (width > 200px) {
        //width: 18.61cqw;
        //width: 14.85cqw;
        width: 16.77cqw;
        top: 9.7cqw;
      }
    `}

  ${({ isHomePage }) =>
    !isHomePage &&
    css`
      display: none;
    `}
`;

const navbarTabStyles = () => css`
  background-color: black;
  color: white;
  font-size: 1.2cqw;
  line-height: 1.2cqw;
  text-align: left;
  border: 0;
  outline: 0;
  user-select: none;
  cursor: pointer;
  font-weight: 700;
  padding: 0.75cqw 1cqw;
  border-top-left-radius: 1cqw;
  border-top-right-radius: 1cqw;
  box-sizing: border-box;
  grid-column: 2 / 3;

  &:hover {
    background-color: #f5ff64;
    color: black;
  }

  & > * {
    text-decoration: none;
    color: inherit;
  }
`;

const BecomeMemberTab = styled('button')`
  ${navbarTabStyles()}
  grid-row: 1 / 2;
`;

const RegisterNewsLetterTab = styled('button')`
  ${navbarTabStyles()}
  grid-row: 2 / 3;
`;

const PreTitleTab = styled('div')`
  ${navbarTabStyles()}
  background-color: #0C9FED;
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  box-model: border-box;
  cursor: default;
  &:hover {
    background-color: #0c9fed;
    color: white;
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
  grid-template-rows: repeat(2, min-content);
  border-bottom: 0.15cqw solid transparent;
  margin: 0 auto;
  align-self: flex-end;

  @container toolbar (width > 200px) {
    grid-template-columns: calc(100% - 2.2cqw - 33.75%) 33.75%;
    width: 100%;
    row-gap: 0.15cqw;
    column-gap: 2.2cqw;
  }

  ${({ navbarState }) =>
    navbarState.includes(NavbarState.High) &&
    css`
      ${RegisterNewsLetterTab} {
        display: none;
      }

      ${BecomeMemberTab} {
        grid-row: 2 / 3;
      }
    `}

  ${({ isHomePage }) =>
    isHomePage &&
    css`
      ${PreTitleTab} {
        display: none;
      }
    `}
`;

const HauptstadtOpenInvoices = styled('div')`
  position: absolute;
  top: 12px;
  right: 12px;
  transform: translateX(100%);
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  grid-template-columns: max-content max-content;
  align-items: center;
  color: ${({ theme }) => theme.palette.error.main};
  font-size: 0.875em;
  font-weight: 600;
`;

export interface ExtendedNavbarProps extends BuilderNavbarProps {
  isMenuOpen?: boolean;
  onMenuToggle?: (isOpen: boolean) => void;
  navPaperClassName?: string;
}

export function TsriV2Navbar({
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
}: ExtendedNavbarProps) {
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

  const getTabText = (pageTypeBasedProps: PageTypeBasedProps | undefined) => {
    if (pageTypeBasedProps) {
      switch (pageTypeBasedProps.pageType) {
        case PageType.Article:
          return pageTypeBasedProps.Article?.preTitle || '';
        case PageType.Author:
          return 'Ich bin Tsüri!';
        case PageType.AuthorList:
          return 'Mir sind Tsüri!';
      }
    }
    return '';
  };

  const mainItems = data?.navigations?.find(({ key }) => key === slug);
  const iconItems = data?.navigations?.find(({ key }) => key === iconSlug);

  const categories = useMemo(
    () =>
      categorySlugs.map(categorySlugArray =>
        categorySlugArray.reduce((navigations, categorySlug) => {
          const navItem = data?.navigations?.find(
            ({ key }) => key === categorySlug
          );

          if (navItem) {
            navigations.push(navItem);
          }

          return navigations;
        }, [] as FullNavigationFragment[])
      ),
    [categorySlugs, data?.navigations]
  );

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const navbarState = getNavbarState(
    isScrolled,
    scrollDirection,
    isMenuOpen,
    hasActiveSubscription
  );

  const isHomePage = pageTypeBasedProps?.Page?.slug === '';

  const tabText = getTabText(pageTypeBasedProps);

  const navbarStyles = useMemo(
    () => cssVariables(navbarState, isHomePage),
    [navbarState, isHomePage]
  );

  return (
    <NavbarWrapper className={className}>
      <GlobalStyles styles={navbarStyles} />
      {isMenuOpen && forceHideBanner}

      <AppBar
        position="static"
        elevation={0}
        color={'transparent'}
      >
        <NavbarInnerWrapper navbarState={navbarState}>
          <NavbarLoginLink
            href="/"
            aria-label="Startseite"
            isMenuOpen={isMenuOpen}
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
              isMenuOpen={isMenuOpen}
              isHomePage={isHomePage}
            />
            <TsriClaim
              src={imagesBase64?.claim ? imagesBase64.claim : '/claim.gif'}
              alt="Unabhängig, Kritisch, Lokal."
              isScrolled={isScrolled}
              isMenuOpen={isMenuOpen}
              isHomePage={isHomePage}
            />
          </NavbarLoginLink>

          <NavbarMain>
            <NavbarIconButtonWrapper>
              <NavbarSearchButton
                size="small"
                aria-label="Suche"
                color={'inherit'}
              >
                <FiSearch />
              </NavbarSearchButton>
            </NavbarIconButtonWrapper>
            <NavbarIconButtonWrapper>
              <NavbarHamburgerButton
                size="small"
                aria-label="Menu"
                onClick={toggleMenu}
                color={'inherit'}
              >
                {!isMenuOpen && <FiMenu />}
                {isMenuOpen && <FiPlus css={{ transform: 'rotate(45deg)' }} />}

                {hasUnpaidInvoices && profileBtn && (
                  <HauptstadtOpenInvoices>
                    <MdWarning size={24} />

                    <Box sx={{ display: { xs: 'none', md: 'unset' } }}>
                      Abo Jetzt Bezahlen
                    </Box>
                  </HauptstadtOpenInvoices>
                )}
              </NavbarHamburgerButton>
            </NavbarIconButtonWrapper>
          </NavbarMain>

          <NavbarTabs
            navbarState={navbarState}
            isHomePage={isHomePage}
          >
            <PreTitleTab>
              <span>{tabText}</span>
            </PreTitleTab>
            <BecomeMemberTab>
              <a href="#">Member werden</a>
            </BecomeMemberTab>
            <RegisterNewsLetterTab>
              <a href="#">Newsletter kostenlos abonnieren</a>
            </RegisterNewsLetterTab>
          </NavbarTabs>
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
    </NavbarWrapper>
  );
}

export const NavPaperWrapper = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen: boolean }>`
  padding: 2rem;
  background: linear-gradient(to bottom, rgb(12 159 237), rgba(12 159 237 0.4));
  color: ${({ theme }) => theme.palette.primary.contrastText};
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  transform: translate3d(
    ${({ isMenuOpen }) => (isMenuOpen ? '0' : '-100%')},
    0,
    0
  );
  transition: transform 300ms ease-in-out;
  overflow-y: scroll;
  max-height: 100vh;
  padding-bottom: ${({ theme }) => theme.spacing(10)};
  height: 200px;
  background: red;
  z-index: 10;

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(6)};
      row-gap: ${theme.spacing(12)};
      grid-template-columns: 1fr 1fr;
      padding: ${theme.spacing(2.5)} calc(100% / 6) calc(100% / 12);
    }
  `}
`;

export const NavPaperCategory = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  grid-auto-rows: max-content;
`;

export const NavPaperName = styled('span')`
  text-transform: uppercase;
  font-weight: 300;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
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
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  `}
`;

const navPaperLinkStyling = (theme: Theme) => css`
  ${theme.breakpoints.up('sm')} {
    border-bottom: 0;
  }
`;

export const NavPaperCategoryLinks = styled('div')`
  display: grid;
  grid-auto-rows: max-content;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
`;

export const NavPaperMainLinks = styled(NavPaperCategoryLinks)`
  gap: 0;

  span {
    font-family: inherhit;
  }
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
    elements: { Link, Button, H4, H6 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { hasUser, logout } = useUser();
  const theme = useTheme();

  const showMenu = true;

  if (!showMenu) {
    return null;
  }

  return (
    <NavPaperWrapper
      isMenuOpen={isMenuOpen}
      className={`${className || ''} ${isMenuOpen ? 'menu-open' : ''}`.trim()}
    >
      {children && (
        <NavPaperChildrenWrapper>{children}</NavPaperChildrenWrapper>
      )}

      <NavPaperMainLinks>
        {main?.links.map((link, index) => {
          const url = navigationLinkToUrl(link);

          return (
            <Link
              href={url}
              key={index}
              color="inherit"
              underline="none"
              onClick={closeMenu}
            >
              <H4
                component="span"
                css={{ fontWeight: '700' }}
              >
                {link.label}
              </H4>
            </Link>
          );
        })}

        <NavPaperActions>
          {hasUnpaidInvoices && profileBtn && (
            <Button
              LinkComponent={Link}
              variant="contained"
              color="warning"
              onClick={closeMenu}
              startIcon={<MdWarning />}
              {...profileBtn}
            >
              Offene Rechnung
            </Button>
          )}

          {!hasRunningSubscription && subscribeBtn && (
            <Button
              LinkComponent={Link}
              variant="contained"
              color="secondary"
              onClick={closeMenu}
              {...subscribeBtn}
            >
              {t('navbar.subscribe')}
            </Button>
          )}

          {hasUser && profileBtn && (
            <Button
              LinkComponent={Link}
              variant="outlined"
              color="secondary"
              onClick={closeMenu}
              {...profileBtn}
            >
              Mein Konto
            </Button>
          )}

          {hasUser && (
            <Button
              onClick={() => {
                logout();
                closeMenu();
              }}
              variant="contained"
              color="primary"
            >
              Logout
            </Button>
          )}

          {!hasUser && loginBtn && (
            <Button
              LinkComponent={Link}
              variant="outlined"
              color="secondary"
              onClick={closeMenu}
              {...loginBtn}
            >
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
                <NavPaperCategoryLinks>
                  {nav.links?.map((link, index) => {
                    const url = navigationLinkToUrl(link);

                    return (
                      <Link
                        href={url}
                        key={index}
                        color="inherit"
                        underline="none"
                        css={navPaperLinkStyling(theme)}
                        onClick={closeMenu}
                      >
                        <H6
                          component="span"
                          css={{ fontWeight: '400' }}
                        >
                          {link.label}
                        </H6>
                      </Link>
                    );
                  })}
                </NavPaperCategoryLinks>
              </NavPaperCategory>
            ))}
          </NavPaperLinksGroup>
        ))}
    </NavPaperWrapper>
  );
};
