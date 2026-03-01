import { AppBar, Box, css, Theme, Toolbar, useTheme } from '@mui/material';
import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import { FullNavigationFragment } from '@wepublish/website/api';
import {
  BuilderNavbarProps,
  Button,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { MdClose, MdMenu, MdWarning } from 'react-icons/md';
import { navigationLinkToUrl } from '../link-to-url';
import { useTranslation } from 'react-i18next';
import { ButtonProps, TextToIcon } from '@wepublish/ui';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto';
  }
}

export const NavbarWrapper = styled('nav')`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: ${({ theme }) => theme.palette.background.default};

  :root {
    --navbar-height: ${({ theme }) => theme.spacing(6.5)};

    ${({ theme }) => theme.breakpoints.up('md')} {
      --navbar-height: ${({ theme }) => theme.spacing(7.5)};
    }

    ${({ theme }) => theme.breakpoints.up('lg')} {
      --navbar-height: ${({ theme }) => theme.spacing(12.5)};
    }
  }
`;

const appBarStyles = (isMenuOpen: boolean) => (theme: Theme) =>
  isMenuOpen ?
    css`
      background-color: ${theme.palette.primary.main};
      color: ${theme.palette.primary.contrastText};
    `
  : null;

export const NavbarInnerWrapper = styled(Toolbar)`
  display: grid;
  grid-template-columns: max-content max-content 1fr;
  align-items: center;
  grid-auto-flow: column;
  justify-items: center;
  min-height: unset;
  padding: 0;

  ${({ theme }) => css`
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
    white-space: nowrap;
    flex-wrap: nowrap;
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

export const NavbarIconButtonWrapper = styled('div')`
  background-color: ${({ theme }) => theme.palette.primary.main};
  display: flex;
  justify-content: center;
  align-items: center;
  height: var(--navbar-height);
  aspect-ratio: 1;
  color: ${({ theme }) => theme.palette.common.white};

  ${({ theme }) => theme.breakpoints.up('md')} {
    svg {
      font-size: ${({ theme }) => theme.spacing(4.5)};
    }
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    svg {
      font-size: ${({ theme }) => theme.spacing(6.5)};
    }
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

export const NavbarButton = styled(Button)`
  ${({ theme }) => theme.breakpoints.up('sm')} {
    font-size: calc(${({ theme }) => theme.typography.button.fontSize} * 1.1);
    padding: ${({ theme }) => theme.spacing(1, 1.5)};
  }
`;

export const NavbarLogoWrapper = styled('div')`
  fill: currentColor;
  width: auto;
`;

export const NavbarSpacer = styled('div')``;

export const NavbarLogo = styled(Image)`
  max-height: ${({ theme }) => theme.spacing(5)};
  max-width: ${({ theme }) => theme.spacing(15)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    max-height: ${({ theme }) => theme.spacing(6)};
    max-width: ${({ theme }) => theme.spacing(30)};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    max-height: ${({ theme }) => theme.spacing(9)};
    max-width: ${({ theme }) => theme.spacing(38)};
  }
`;

export interface ExtendedNavbarProps extends BuilderNavbarProps {
  isMenuOpen?: boolean;
  onMenuToggle?: (isOpen: boolean) => void;
  navPaperClassName?: string;
}

export function Navbar({
  className,
  children,
  categorySlugs,
  slug,
  headerSlug,
  iconSlug,
  data,
  logo,
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

  const isMenuOpen =
    controlledIsMenuOpen !== undefined ? controlledIsMenuOpen : (
      internalIsMenuOpen
    );

  const toggleMenu = useCallback(() => {
    const newState = !isMenuOpen;
    if (controlledIsMenuOpen === undefined) {
      setInternalMenuOpen(newState);
    }
    onMenuToggle?.(newState);
  }, [isMenuOpen, controlledIsMenuOpen, onMenuToggle]);

  const { t } = useTranslation();

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

  const {
    elements: { IconButton, Image, Button },
  } = useWebsiteBuilder();

  return (
    <NavbarWrapper className={className}>
      <AppBar
        position="static"
        elevation={0}
        color={'transparent'}
        css={appBarStyles(isMenuOpen)}
      >
        <NavbarInnerWrapper>
          <NavbarMain>
            <NavbarIconButtonWrapper>
              <IconButton
                size="large"
                aria-label="Menu"
                onClick={toggleMenu}
                color={'inherit'}
              >
                {!isMenuOpen && <MdMenu />}
                {isMenuOpen && <MdClose />}
              </IconButton>
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
              {!!logo && (
                <NavbarLogo
                  image={logo}
                  loading="eager"
                  fetchPriority="high"
                />
              )}
            </NavbarLogoWrapper>
          </NavbarLoginLink>

          <NavbarActions isMenuOpen={isMenuOpen}>
            {hasUnpaidInvoices && profileBtn && (
              <NavbarButton
                LinkComponent={Link}
                color="warning"
                startIcon={<MdWarning />}
                size="medium"
                {...profileBtn}
              >
                <Box sx={{ display: { xs: 'none', md: 'unset' } }}>Offene</Box>
                &nbsp;Rechnung
              </NavbarButton>
            )}

            {!hasRunningSubscription && !hasUnpaidInvoices && subscribeBtn && (
              <NavbarButton
                LinkComponent={Link}
                size="medium"
                {...subscribeBtn}
              >
                {t('navbar.subscribe')}
              </NavbarButton>
            )}

            {hasRunningSubscription && !hasUnpaidInvoices && profileBtn && (
              <NavbarButton
                LinkComponent={Link}
                size="medium"
                {...profileBtn}
              >
                Mein Konto
              </NavbarButton>
            )}
          </NavbarActions>
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

export const NavPaperWrapper = styled('div')`
  padding: ${({ theme }) => theme.spacing(2.5)};
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  position: absolute;
  bottom: 1px; // Fixes a 1px gap between navbar and paper
  left: 0;
  right: 0;
  transform: translateY(100%);
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

export const NavPaperLink = styled(Link)`
  ${({ theme }) => theme.breakpoints.up('sm')} {
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
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const NavPaperChildrenWrapper = styled('div')`
  position: relative;
  padding: ${({ theme }) => theme.spacing(1.5)};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  justify-items: center;
  width: 100%;

  ${({ theme }) => css`
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

  const showMenu = className ? true : isMenuOpen; // For custom styling (like Hauptstadt), always show. For default, show when open.

  if (!showMenu) {
    return null;
  }

  return (
    <NavPaperWrapper
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
                <NavPaperName>{nav.name}</NavPaperName>

                <NavPaperCategoryLinks>
                  {nav.links?.map((link, index) => {
                    const url = navigationLinkToUrl(link);

                    return (
                      <NavPaperLink
                        href={url}
                        key={index}
                        color="inherit"
                        underline="none"
                        onClick={closeMenu}
                      >
                        <H6
                          component="span"
                          css={{ fontWeight: '700' }}
                        >
                          {link.label}
                        </H6>
                      </NavPaperLink>
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
