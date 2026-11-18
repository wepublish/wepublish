import styled from '@emotion/styled';
import { AppBar, Box, css, Theme } from '@mui/material';
import { MdPerson, MdWarning } from 'react-icons/md';
import {
  ExtendedNavbarProps,
  NavbarActions,
  NavbarIconButtonWrapper,
  NavbarInnerWrapper,
  NavbarLink,
  NavbarLinks,
  NavbarLoginLink,
  NavbarLogoWrapper,
  NavbarMain,
  NavbarWrapper,
  navigationLinkToUrl,
} from '@wepublish/navigation/website';
import { TextToIcon } from '@wepublish/ui';
import { FullNavigationFragment } from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { courantTokens } from '../brand-tokens';
import { CourantLogo } from './courant-logo';
import { CourantNavPaper } from './courant-nav-paper';
import { MenuCloseIcon, MenuOpenIcon } from './courant-menu-icons';

const { pageInline, pageMaxWidth } = courantTokens.layout;
const { alert } = courantTokens.colors;

const alertButtonSx = {
  backgroundColor: alert[500],
  color: '#fff',
  '&:hover': { backgroundColor: alert[600] },
};

const CourantNavbarWrapper = styled(NavbarWrapper)`
  --navbar-height: 56px;
  background-color: rgba(255, 255, 255, 0.85);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);

  ${({ theme }) => theme.breakpoints.up('md')} {
    --navbar-height: 72px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    --navbar-height: 88px;
  }
`;

// Collapse the reserved links column when no top-level links are rendered;
// re-expand automatically if a second child appears.
const CourantNavbarMain = styled(NavbarMain)`
  grid-template-columns: max-content;
  &:has(> :nth-child(2)) {
    grid-template-columns: max-content 1fr;
  }
`;

// Match gutters with rest of page layout
const CourantNavbarInnerWrapper = styled(NavbarInnerWrapper)`
  width: 100%;
  max-width: ${pageMaxWidth}px;
  margin-inline: auto;
  grid-template-columns: auto auto 1fr;
  column-gap: ${({ theme }) => theme.spacing(2)};
  padding-inline: ${({ theme }) => theme.spacing(pageInline.xs)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: 1fr min-content 1fr;
    padding-inline: ${({ theme }) => theme.spacing(pageInline.sm)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding-inline: ${({ theme }) => theme.spacing(pageInline.md)};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-inline: ${({ theme }) => theme.spacing(pageInline.lg)};
  }
`;

const CourantIconButtonWrapper = styled(NavbarIconButtonWrapper)`
  background-color: transparent;
  color: ${({ theme }) => theme.palette.common.black};
  aspect-ratio: unset;
  width: auto;
  padding-inline: 0;

  /* Offset the IconButton's own inline padding so the burger's visual edge
     aligns with the page gutter. MUI IconButton size="large" = 12px padding. */
  .MuiIconButton-root {
    margin-inline-start: -12px;
  }

  svg {
    font-size: 1.5rem;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    svg {
      font-size: 1.75rem;
    }
  }
`;

const logoStyles = (theme: Theme) => css`
  height: ${theme.spacing(4.5)};
  width: auto;
  display: flex;

  ${theme.breakpoints.up('sm')} {
    height: ${theme.spacing(6)};
  }

  ${theme.breakpoints.up('md')} {
    height: ${theme.spacing(8)};
  }

  ${theme.breakpoints.up('lg')} {
    height: ${theme.spacing(9)};
  }
`;

const appBarStyles = (isMenuOpen: boolean) => (theme: Theme) =>
  isMenuOpen ?
    css`
      background-color: ${theme.palette.primary.main};
      color: ${theme.palette.primary.contrastText};
    `
  : null;

export const CourantNavbar = ({
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
  subscribeBtn = { href: '/membres' },
  isMenuOpen: controlledIsMenuOpen,
  onMenuToggle,
  navPaperClassName,
  navbarActions,
  paperActions,
}: ExtendedNavbarProps) => {
  const [internalIsMenuOpen, setInternalMenuOpen] = useState(false);
  const isMenuOpen =
    controlledIsMenuOpen !== undefined ? controlledIsMenuOpen : (
      internalIsMenuOpen
    );

  const toggleMenu = useCallback(() => {
    const next = !isMenuOpen;
    if (controlledIsMenuOpen === undefined) setInternalMenuOpen(next);
    onMenuToggle?.(next);
  }, [isMenuOpen, controlledIsMenuOpen, onMenuToggle]);

  const { t } = useTranslation();
  const {
    elements: { IconButton, Button },
  } = useWebsiteBuilder();

  const mainItems = data?.navigations?.find(({ key }) => key === slug);
  const headerItems = data?.navigations?.find(({ key }) => key === headerSlug);
  const iconItems = data?.navigations?.find(({ key }) => key === iconSlug);

  const categories = useMemo(
    () =>
      categorySlugs.map(slugs =>
        slugs.reduce((acc, s) => {
          const nav = data?.navigations?.find(({ key }) => key === s);
          if (nav) acc.push(nav);
          return acc;
        }, [] as FullNavigationFragment[])
      ),
    [categorySlugs, data?.navigations]
  );

  return (
    <CourantNavbarWrapper className={className}>
      <AppBar
        position="static"
        elevation={0}
        color="transparent"
        css={appBarStyles(isMenuOpen)}
      >
        <CourantNavbarInnerWrapper>
          <CourantNavbarMain>
            <CourantIconButtonWrapper>
              <IconButton
                size="large"
                aria-label="Menu"
                onClick={toggleMenu}
                color="inherit"
              >
                {isMenuOpen ?
                  <MenuCloseIcon />
                : <MenuOpenIcon />}
              </IconButton>
            </CourantIconButtonWrapper>

            {!!headerItems?.links.length && (
              <NavbarLinks isMenuOpen={isMenuOpen}>
                {headerItems.links.map((link, i) => (
                  <NavbarLink
                    key={i}
                    href={navigationLinkToUrl(link)}
                  >
                    {link.label}
                  </NavbarLink>
                ))}
              </NavbarLinks>
            )}
          </CourantNavbarMain>

          <NavbarLoginLink
            href="/"
            aria-label="Accueil"
            isMenuOpen={isMenuOpen}
          >
            <NavbarLogoWrapper>
              <CourantLogo css={logoStyles} />
            </NavbarLogoWrapper>
          </NavbarLoginLink>

          <NavbarActions isMenuOpen={isMenuOpen}>
            {navbarActions}

            {hasUnpaidInvoices && profileBtn && (
              <Button
                LinkComponent={Link}
                size="medium"
                startIcon={<MdWarning />}
                sx={alertButtonSx}
                {...profileBtn}
              >
                <Box sx={{ display: { xs: 'none', md: 'unset' } }}>
                  {t('navbar.unpaid')}
                </Box>
                &nbsp;{t('navbar.invoice')}
              </Button>
            )}

            {!hasRunningSubscription && !hasUnpaidInvoices && subscribeBtn && (
              <Button
                LinkComponent={Link}
                size="medium"
                {...subscribeBtn}
              >
                {t('navbar.subscribe')}
              </Button>
            )}

            {hasRunningSubscription && !hasUnpaidInvoices && profileBtn && (
              <Button
                LinkComponent={Link}
                size="medium"
                aria-label={t('navbar.myAccount')}
                {...profileBtn}
              >
                <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {t('navbar.myAccount')}
                </Box>
                <Box
                  component="span"
                  sx={{
                    display: { xs: 'inline-flex', sm: 'none' },
                    lineHeight: 0,
                  }}
                  aria-hidden
                >
                  <MdPerson />
                </Box>
              </Button>
            )}
          </NavbarActions>
        </CourantNavbarInnerWrapper>
      </AppBar>

      {Boolean(mainItems || categories?.length) && (
        <CourantNavPaper
          className={navPaperClassName}
          isMenuOpen={isMenuOpen}
          closeMenu={toggleMenu}
          main={mainItems}
          loginBtn={loginBtn}
          profileBtn={profileBtn}
          subscribeBtn={subscribeBtn}
          hasRunningSubscription={hasRunningSubscription}
          hasUnpaidInvoices={hasUnpaidInvoices}
          paperActions={paperActions}
        >
          {iconItems?.links.map((link, i) => (
            <Link
              key={i}
              href={navigationLinkToUrl(link)}
              color="inherit"
              onClick={toggleMenu}
            >
              <TextToIcon
                title={link.label}
                size={32}
              />
            </Link>
          ))}
          {children}
        </CourantNavPaper>
      )}
    </CourantNavbarWrapper>
  );
};
