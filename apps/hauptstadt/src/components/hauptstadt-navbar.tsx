import styled from '@emotion/styled';
import {
  AppBar,
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
import {
  BuilderNavbarProps,
  IconButton,
  Link,
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
// Feather icons as we can change the stroke width and Hauptstadt wants a thinner icon
import { FiMenu, FiPlus } from 'react-icons/fi';
import { MdSearch, MdWarning } from 'react-icons/md';

import { useInformUserAboutUpgrade } from '../hooks/inform-user-upgrade';
import { Tiempos } from '../theme';

enum NavbarState {
  Hidden,
  Diagonal,
  Regular,
}

enum ScrollDirection {
  Up,
  Down,
}

const cssVariables = (state: NavbarState[]) => (theme: Theme) => css`
  :root {
    --navbar-height: 80px;
    --scrolled-navbar-height: 55px;
    --changing-navbar-height: ${state.includes(NavbarState.Regular) ?
      'var(--navbar-height)'
    : 'var(--scrolled-navbar-height)'};

    ${theme.breakpoints.up('sm')} {
      --navbar-height: 109px;
    }

    ${theme.breakpoints.up('lg')} {
      --navbar-height: 145px;
      --scrolled-navbar-height: 80px;
    }

    ${theme.breakpoints.up('xl')} {
      --navbar-height: 173px;
    }

    ${theme.breakpoints.up('xxl')} {
      --navbar-height: 208px;
    }
  }
`;

export const NavbarWrapper = styled('nav')`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  height: var(--navbar-height);
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
    return [NavbarState.Regular];
  }

  if (hasActiveSubscription) {
    if (scrollDirection === ScrollDirection.Down) {
      return [NavbarState.Hidden, NavbarState.Diagonal];
    }
  }

  return [NavbarState.Diagonal];
};

export const NavbarInnerWrapper = styled(Toolbar, {
  shouldForwardProp: propName => propName !== 'navbarState',
})<{
  navbarState: NavbarState[];
}>`
  display: grid;
  grid-template-columns: 1fr max-content 1fr;
  row-gap: ${({ theme }) => theme.spacing(0.5)};
  align-content: center;
  align-items: center;
  justify-items: center;
  min-height: unset;
  padding: 0;
  margin: 0 auto;
  width: 100%;
  height: var(--changing-navbar-height);
  background-color: ${({ theme }) => theme.palette.background.paper};

  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
  transition:
    clip-path 300ms ease-out,
    transform 300ms ease-out,
    height 300ms ease-out;
  transform: translate3d(0, 0, 0);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${({ theme }) => theme.palette.background.paper};
    transition: clip-path 300ms ease-out;
    clip-path: polygon(
      0 100%,
      100% 100%,
      100% calc(100% - 1px),
      0 calc(100% - 1px)
    );
    z-index: 2;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: clip-path 300ms ease-out;
    clip-path: polygon(
      0 calc(100% - 1px),
      100% calc(100% - 1px),
      100% 100%,
      0 100%
    );
    z-index: 10;

    ${({ theme }) => theme.breakpoints.up('sm')} {
      background-color: ${({ theme }) => theme.palette.primary.main};
    }
  }

  ${({ navbarState, theme }) =>
    navbarState.includes(NavbarState.Diagonal) &&
    css`
      clip-path: polygon(0px 0px, 100% 0px, 100% 50%, 0px 100%);
      box-shadow: 0 7px 10px -3px rgba(0, 0, 0, 0.18);

      &::before {
        clip-path: polygon(0 88%, 100% 38%, 100% 50%, 0 100%);
      }

      &::after {
        background-color: ${theme.palette.primary.main};
        clip-path: polygon(
          0 calc(100% - 1px),
          100% calc(50% - 1px),
          100% 50%,
          0 100%
        );
      }
    `}

  ${({ navbarState, theme }) =>
    navbarState.includes(NavbarState.Hidden) &&
    css`
      ${theme.breakpoints.down('sm')} {
        transform: translate3d(0, -100%, 0);
      }
    `}

  ${({ theme }) => theme.breakpoints.up('sm')} {
    min-height: unset;
    padding: 0;
    row-gap: ${({ theme }) => theme.spacing(1)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    min-height: unset;
    padding: 0;
    row-gap: ${({ theme }) => theme.spacing(1.5)};
  }
`;

export const NavbarLinks = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen?: boolean }>`
  display: none;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
  justify-content: flex-start;
  width: 100%;

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}

  @media (min-width: 740px) {
    // custom for maximum space usage
    display: flex;
  }
`;

export const NavbarLink = styled(Link)`
  font-size: 1rem;
  text-decoration: none;
  color: ${({ theme }) => theme.palette.common.black};

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 1.3rem;
  }
`;

export const NavbarMain = styled('div')<{ isMenuOpen?: boolean }>`
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: center;
  justify-self: start;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}
`;

export const NavbarActions = styled('div', {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen?: boolean }>`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-self: end;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-right: ${({ theme }) => theme.spacing(1)};
  justify-self: end;

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

export const NavbarMenuButton = styled(IconButton)`
  position: relative;
  padding: 0;

  > svg {
    font-size: 28px;
    stroke-width: 1.25px;

    ${({ theme }) => theme.breakpoints.up('lg')} {
      font-size: 35px;
    }

    ${({ theme }) => theme.breakpoints.up('xxl')} {
      font-size: 45px;
    }
  }
`;

export const NavbarIconButtonWrapper = styled('div')`
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1;
  padding-left: ${({ theme }) => theme.spacing(1)};
`;

export const NavbarSearchIconButtonWrapper = styled(NavbarIconButtonWrapper)`
  padding-left: 0;

  svg {
    stroke-width: 0;
  }
`;

export const NavbarLoginLink = styled(Link, {
  shouldForwardProp: propName => propName !== 'isMenuOpen',
})<{ isMenuOpen: boolean }>`
  color: unset;
  display: grid;
  align-items: center;
  justify-items: center;
  justify-self: center;

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `}
`;

export const NavbarLogoWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 220px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    width: 350px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    width: 440px;
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    width: 550px;
  }

  ${({ theme }) => theme.breakpoints.up('xxl')} {
    width: 700px;
  }
`;

export const HauptstadtClaimWrapper = styled(NavbarLogoWrapper)`
  grid-row: 2;
  grid-column: -1/1;
`;

const HauptstadtLogo = styled('img', {
  shouldForwardProp: propName =>
    propName !== 'isScrolled' && propName !== 'isMenuOpen',
})<{ isScrolled?: boolean; isMenuOpen?: boolean }>`
  width: 100%;
  transition: width 300ms ease-out;
  transform: translate3d(0, 0, 0);

  ${({ theme, isScrolled, isMenuOpen }) =>
    isScrolled &&
    !isMenuOpen &&
    css`
      ${theme.breakpoints.up('sm')} {
        width: 220px;
      }

      ${theme.breakpoints.up('lg')} {
        width: 330px;
      }

      ${theme.breakpoints.up('xl')} {
        width: 330px;
      }

      ${theme.breakpoints.up('xxl')} {
        width: 330px;
      }
    `}
`;

const HauptstadtClaim = styled('img', {
  shouldForwardProp: propName =>
    propName !== 'isScrolled' && propName !== 'isMenuOpen',
})<{ isScrolled?: boolean; isMenuOpen?: boolean }>`
  width: 100%;
  transition: width 300ms ease-out;
  transform: translate3d(0, 0, 0);
  max-height: 9px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    max-height: 14px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    max-height: 18px;
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    max-height: 22px;
  }

  ${({ theme }) => theme.breakpoints.up('xxl')} {
    max-height: 29px;
  }

  ${({ isScrolled, isMenuOpen }) =>
    isScrolled &&
    !isMenuOpen &&
    css`
      width: 0px;
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

export function HauptstadtNavbar({
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

  const mainItems = data?.navigations?.find(({ key }) => key === slug);
  const headerItems = data?.navigations?.find(({ key }) => key === headerSlug);
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
  const navbarHeight = useMemo(() => cssVariables(navbarState), [navbarState]);

  const [canUpgrade] = useInformUserAboutUpgrade();

  return (
    <NavbarWrapper className={className}>
      <GlobalStyles styles={navbarHeight} />
      {isMenuOpen && forceHideBanner}

      <AppBar
        position="static"
        elevation={0}
        color={'transparent'}
      >
        <NavbarInnerWrapper navbarState={navbarState}>
          <NavbarMain>
            <NavbarIconButtonWrapper>
              <NavbarMenuButton
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
                      Offene Rechnungen
                    </Box>
                  </HauptstadtOpenInvoices>
                )}

                {!hasUnpaidInvoices && subscribeBtn && canUpgrade && (
                  <HauptstadtOpenInvoices>
                    <MdWarning size={24} />

                    <Box sx={{ display: { xs: 'none', md: 'unset' } }}>
                      Jetzt Upgraden
                    </Box>
                  </HauptstadtOpenInvoices>
                )}
              </NavbarMenuButton>
            </NavbarIconButtonWrapper>

            {!!headerItems?.links.length && (
              <NavbarLinks isMenuOpen={isMenuOpen}>
                {headerItems.links.map((link, index) => (
                  <NavbarLink
                    key={index}
                    href={navigationLinkToUrl(link)}
                  >
                    {link.label}
                  </NavbarLink>
                ))}
              </NavbarLinks>
            )}
          </NavbarMain>

          <NavbarLoginLink
            href="/"
            aria-label="Startseite"
            isMenuOpen={isMenuOpen}
          >
            <NavbarLogoWrapper>
              <HauptstadtLogo
                src="/logo.svg"
                alt="Hauptstadt"
                isScrolled={isScrolled}
                isMenuOpen={isMenuOpen}
              />
            </NavbarLogoWrapper>
          </NavbarLoginLink>

          <NavbarActions isMenuOpen={isMenuOpen}>
            {(!isScrolled || isMenuOpen) && (
              <Link
                href="/search"
                color="inherit"
              >
                <NavbarSearchIconButtonWrapper>
                  <NavbarMenuButton
                    color="inherit"
                    size="small"
                  >
                    <MdSearch aria-label="Suche" />
                  </NavbarMenuButton>
                </NavbarSearchIconButtonWrapper>
              </Link>
            )}
          </NavbarActions>

          <HauptstadtClaimWrapper>
            <HauptstadtClaim
              src="/logo-claim.svg"
              alt="Neuer Berner Journalismus"
              isScrolled={isScrolled}
              isMenuOpen={isMenuOpen}
            />
          </HauptstadtClaimWrapper>
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
  padding: ${({ theme }) => theme.spacing(2.5)};
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  position: absolute;
  top: calc(var(--navbar-height) - 2px);
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
    font-family: ${Tiempos.style.fontFamily};
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
  const [canUpgrade] = useInformUserAboutUpgrade();

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

          {!hasUnpaidInvoices && canUpgrade && (
            <Button
              LinkComponent={Link}
              variant="contained"
              color="warning"
              onClick={closeMenu}
              startIcon={<MdWarning />}
              {...subscribeBtn}
            >
              Jetzt Upgraden
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
