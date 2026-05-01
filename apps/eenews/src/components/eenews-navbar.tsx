import styled from '@emotion/styled';
import { Box, Button, Container, Typography } from '@mui/material';
import { useUser } from '@wepublish/authentication/website';
import { useHasUnpaidInvoices } from '@wepublish/membership/website';
import { BuilderNavbarProps } from '@wepublish/website/builder';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { eenewsColors } from '../theme';
import { EenewsMenuOverlay } from './eenews-menu-overlay';

const InvoiceAlertPill = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 8px;
  background: ${eenewsColors.alert};
  color: ${eenewsColors.paper};
  border-radius: 999px;
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s ease;

  &:hover {
    background: ${eenewsColors.alertDeep};
  }
`;

const InvoiceAlertPulse = styled('span')`
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: ${eenewsColors.paper};
  animation: invoice-alert-pulse 1.6s infinite;

  @keyframes invoice-alert-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(245, 240, 230, 0.7);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(245, 240, 230, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(245, 240, 230, 0);
    }
  }
`;

// Single-toggle pattern from tsri-v2-navbar.tsx (NavbarWrapper +
// NavbarInnerWrapper + NavbarMain): when the menu drawer is open, the topbar
// elevates above the drawer's z-index but its background goes transparent and
// `pointer-events` becomes `none` so clicks pass through to the drawer. The
// Themen pill button (the only element that keeps `pointer-events: all`) is
// the same physical button used to open AND close the menu. Logo / utility
// row / bottom nav strip / Unterstützen / Suche all become `visibility:
// hidden` so the layout doesn't reflow but they're invisible.
const TopbarShell = styled('header')<{
  scrolled: boolean;
  menuOpen: boolean;
}>`
  position: sticky;
  top: 0;
  z-index: ${({ menuOpen }) => (menuOpen ? 80 : 50)};
  background: ${({ scrolled, menuOpen }) =>
    menuOpen ? 'transparent'
    : scrolled ? 'rgba(245,240,230,0.92)'
    : eenewsColors.paper};
  backdrop-filter: ${({ scrolled, menuOpen }) =>
    !menuOpen && scrolled ? 'saturate(140%) blur(8px)' : 'none'};
  -webkit-backdrop-filter: ${({ scrolled, menuOpen }) =>
    !menuOpen && scrolled ? 'saturate(140%) blur(8px)' : 'none'};
  /* Suppress the bottom border when the menu drawer is open — the drawer's
     own border carries the visual separation; doubling them creates a seam. */
  border-bottom: 1px solid
    ${({ scrolled, menuOpen }) =>
      menuOpen ? 'transparent'
      : scrolled ? eenewsColors.rule
      : 'transparent'};
  /* When menu is open, the wrapper does not catch clicks — only the Themen
     pill below explicitly opts back in via pointer-events: all. */
  pointer-events: ${({ menuOpen }) => (menuOpen ? 'none' : 'auto')};
  transition:
    background 0.25s ease,
    border-color 0.25s ease;
`;

const UtilityRow = styled('div', {
  shouldForwardProp: prop => prop !== 'menuOpen',
})<{ menuOpen?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid ${eenewsColors.rule};
  color: ${eenewsColors.inkSoft};
  visibility: ${({ menuOpen }) => (menuOpen ? 'hidden' : 'visible')};
  @media (max-width: 800px) {
    display: none;
  }
`;

const UtilityRight = styled('div')`
  display: flex;
  gap: 18px;
  align-items: center;
`;

const RegionToggle = styled('div')`
  display: inline-flex;
  border: 1px solid ${eenewsColors.ruleStrong};
  border-radius: 999px;
  padding: 2px;
`;

const RegionPill = styled(Link, {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>`
  appearance: none;
  border: 0;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 999px;
  background: ${({ active }) => (active ? eenewsColors.ink : 'transparent')};
  color: ${({ active }) => (active ? eenewsColors.paper : eenewsColors.ink)};
  text-decoration: none;
  transition:
    background 0.2s ease,
    color 0.2s ease;
`;

const MainBar = styled('div')`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 18px 0;
  gap: 24px;
  @media (max-width: 800px) {
    grid-template-columns: auto 1fr auto;
    padding: 14px 0;
  }
`;

const PillButton = styled('button')<{ active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  height: 40px;
  background: ${({ active }) => (active ? eenewsColors.ink : 'transparent')};
  color: ${({ active }) => (active ? eenewsColors.paper : eenewsColors.ink)};
  border: 1px solid
    ${({ active }) => (active ? eenewsColors.ink : eenewsColors.ruleStrong)};
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
  &:hover {
    background: ${({ active }) =>
      active ? eenewsColors.ink : 'rgba(14,42,59,0.05)'};
  }
  @media (max-width: 800px) {
    & > .label {
      display: none;
    }
  }
`;

const PillLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  height: 40px;
  background: transparent;
  color: ${eenewsColors.ink};
  border: 1px solid ${eenewsColors.ruleStrong};
  border-radius: 999px;
  text-decoration: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
  &:hover {
    background: rgba(14, 42, 59, 0.05);
  }
`;

const SupportLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  background: ${eenewsColors.ink};
  color: ${eenewsColors.paper};
  border-radius: 999px;
  text-decoration: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  &:hover {
    background: ${eenewsColors.inkSoft};
  }
  @media (max-width: 800px) {
    padding: 0 14px;
    font-size: 13px;
  }
`;

const SupportDot = styled('span')`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: ${eenewsColors.accent};
`;

const LogoLink = styled(Link)`
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  text-decoration: none;
  user-select: none;
  cursor: pointer;
  color: ${eenewsColors.ink};
`;

const LogoMark = styled('span')`
  font-weight: 500;
  font-size: 34px;
  letter-spacing: -0.04em;
  line-height: 1;
  @media (max-width: 800px) {
    font-size: 24px;
  }
`;

const LogoAccent = styled('span')`
  color: ${eenewsColors.accentDeep};
`;

const LogoTagline = styled('span')`
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${eenewsColors.inkSoft};
  padding-bottom: 4px;
  @media (max-width: 1200px) {
    display: none;
  }
`;

// Horizontal topic-nav strip below MainBar — matches v2 shell.js NAV array.
// Each entry maps to either a topic route (/a/tag/<slug>), the home, the
// archive, or the welt page. Active state highlights the current route.
const BottomNavRow = styled('nav', {
  shouldForwardProp: prop => prop !== 'menuOpen',
})<{ menuOpen?: boolean }>`
  display: flex;
  gap: 0;
  overflow-x: auto;
  padding-bottom: 0;
  border-top: 1px solid ${eenewsColors.rule};
  visibility: ${({ menuOpen }) => (menuOpen ? 'hidden' : 'visible')};

  /* Hide scrollbar — keep horizontal scroll only on tight viewports. */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const BottomNavLink = styled(Link, {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>`
  /* inline-block (NOT inline-flex) is critical: the ::before pseudo is a
     block-level child with height: 0 that sits above the visible text.
     Width = max(pseudo width, text width) = bold-weight width in both
     states. With inline-flex the pseudo and text would lay out side-by-side
     and double the link's effective width. */
  display: inline-block;
  text-align: center;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 14px;
  font-weight: ${({ active }) => (active ? 600 : 500)};
  color: ${({ active }) => (active ? eenewsColors.ink : eenewsColors.inkSoft)};
  text-decoration: none;
  white-space: nowrap;
  border-bottom: 2px solid
    ${({ active }) => (active ? eenewsColors.accent : 'transparent')};
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  /* Width-reservation: invisible duplicate of the label rendered at the
     active-state's bold weight locks the link's intrinsic width to the
     wider bold metric — toggling active no longer reflows the row. */
  &::before {
    content: attr(data-label);
    display: block;
    height: 0;
    visibility: hidden;
    overflow: hidden;
    font-weight: 600;
    user-select: none;
    pointer-events: none;
  }

  &:hover {
    color: ${eenewsColors.ink};
  }
`;

type NavItem = {
  label: string;
  href: string;
  /** Predicate that decides whether this entry is the active one given the
   *  current pathname / query. Kept inline so the matching rule travels with
   *  the entry (no separate routing table). */
  isActive: (
    pathname: string,
    query: Record<string, string | string[] | undefined>
  ) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Aktuell',
    href: '/',
    isActive: pathname => pathname === '/',
  },
  {
    label: 'Solar',
    href: '/a/tag/solar',
    isActive: (_, query) => query.tag === 'solar',
  },
  {
    label: 'Wind',
    href: '/a/tag/wind',
    isActive: (_, query) => query.tag === 'wind',
  },
  {
    label: 'Mobilität',
    href: '/a/tag/mobilität',
    isActive: (_, query) => query.tag === 'mobilität',
  },
  {
    label: 'Speicher',
    href: '/a/tag/speicher',
    isActive: (_, query) => query.tag === 'speicher',
  },
  {
    label: 'Politik',
    href: '/a/tag/politik',
    isActive: (_, query) => query.tag === 'politik',
  },
  {
    label: 'Bauen',
    href: '/a/tag/bauen',
    isActive: (_, query) => query.tag === 'bauen',
  },
  {
    label: 'Klima',
    href: '/a/tag/klima',
    isActive: (_, query) => query.tag === 'klima',
  },
  {
    label: 'Dossiers',
    href: '/a',
    isActive: pathname => pathname === '/a',
  },
  {
    label: 'International',
    href: '/welt',
    isActive: pathname => pathname === '/welt',
  },
];

const HamburgerIcon = ({ open }: { open: boolean }) =>
  open ?
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
    >
      <path
        d="M2 2 L12 12 M12 2 L2 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  : <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
    >
      <path
        d="M2 4 H12 M2 10 H12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>;

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
  >
    <circle
      cx="7"
      cy="7"
      r="5"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M11 11 L14 14"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * EE News navbar — v2 design.
 *
 * Topbar utility row (date + region toggle CH/Welt + Newsletter/Login links) +
 * main bar (hamburger + search-link / logo / Unterstützen-link).
 *
 * The region toggle is route-based per Q19: CH = `/`, Welt = `/welt`. Active state
 * highlights whichever route is current.
 *
 * Receives `BuilderNavbarProps` so the wepublish container can supply `slug`,
 * `categorySlugs`, `headerSlug`, `iconSlug` etc.; for the hamburger drawer the menu
 * items are pulled from the provided navigation data via the menu-overlay component.
 */
export const EenewsNavbar = (props: BuilderNavbarProps) => {
  const router = useRouter();
  // `hasUser` is just `!!token` — it stays true after a stale-token
  // state (e.g. database re-seed invalidates the JWT). Drive the UI off
  // `user` instead, which is null until the `me` query resolves.
  const { user, logout } = useUser();
  const isAuthenticated = !!user;
  // The hook safely returns false when no token is present (queries are
  // skipped) so we can call it unconditionally on every page.
  const hasUnpaidInvoices = useHasUnpaidInvoices();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async (event: React.MouseEvent) => {
    event.preventDefault();
    await logout();
    router.replace('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const today = new Date().toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isWelt = router.pathname === '/welt';
  // The CH/Welt toggle is only meaningful on the two home variants — anywhere
  // else it just acts as a surprise "navigate away to the front page" button
  // and creates a false impression that the rest of the site is regionalised.
  const showRegionToggle =
    router.pathname === '/' || router.pathname === '/welt';

  return (
    <>
      <TopbarShell
        scrolled={scrolled}
        menuOpen={menuOpen}
        className={props.className}
      >
        <Container>
          <UtilityRow menuOpen={menuOpen}>
            <Typography
              variant="metaEyebrowSmall"
              component="div"
            >
              {today}
            </Typography>
            <UtilityRight>
              {/* Always rendered to keep the utility row's intrinsic height
                  stable across routes. On non-home pages we hide it via
                  visibility (still occupies its box) instead of unmounting,
                  which would shrink the row and shift all sticky/scroll
                  positions on navigation. `aria-hidden` removes it from
                  assistive tech when not interactive. */}
              <RegionToggle
                role="group"
                aria-label="Region"
                style={{
                  visibility: showRegionToggle ? 'visible' : 'hidden',
                }}
                aria-hidden={!showRegionToggle}
              >
                <RegionPill
                  href="/"
                  active={!isWelt}
                  aria-current={!isWelt ? 'page' : undefined}
                  tabIndex={showRegionToggle ? undefined : -1}
                >
                  <Typography
                    variant="metaEyebrowSmall"
                    component="span"
                    sx={{ color: 'inherit' }}
                  >
                    CH
                  </Typography>
                </RegionPill>
                <RegionPill
                  href="/welt"
                  active={isWelt}
                  aria-current={isWelt ? 'page' : undefined}
                  tabIndex={showRegionToggle ? undefined : -1}
                >
                  <Typography
                    variant="metaEyebrowSmall"
                    component="span"
                    sx={{ color: 'inherit' }}
                  >
                    Welt
                  </Typography>
                </RegionPill>
              </RegionToggle>
              {isAuthenticated && hasUnpaidInvoices ?
                <InvoiceAlertPill
                  href="/profile#offene-rechnungen"
                  title="Du hast offene Rechnungen"
                >
                  <InvoiceAlertPulse aria-hidden="true" />
                  Offene Rechnung
                </InvoiceAlertPill>
              : null}
              <Box
                component={Link}
                href="/newsletter"
                sx={{
                  textDecoration: 'none',
                  color: eenewsColors.inkSoft,
                  ...({ typography: 'uiTopbarLink' } as object),
                }}
              >
                Newsletter
              </Box>
              <Box
                component={Link}
                href={isAuthenticated ? '/profile' : '/login'}
                sx={{
                  textDecoration: 'none',
                  color: eenewsColors.inkSoft,
                  ...({ typography: 'uiTopbarLink' } as object),
                }}
              >
                {isAuthenticated ? 'Mein Konto' : 'Login'}
              </Box>
              {isAuthenticated ?
                <Box
                  component="a"
                  href="#logout"
                  onClick={handleLogout}
                  sx={{
                    textDecoration: 'none',
                    color: eenewsColors.inkSoft,
                    cursor: 'pointer',
                    ...({ typography: 'uiTopbarLink' } as object),
                  }}
                >
                  Logout
                </Box>
              : null}
            </UtilityRight>
          </UtilityRow>
          <MainBar>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                // Themen pill needs to stay interactive even when the wrapper
                // has pointer-events: none (menu open).
                pointerEvents: 'auto',
              }}
            >
              <PillButton
                onClick={() => setMenuOpen(v => !v)}
                active={menuOpen}
                aria-label={menuOpen ? 'Menü schliessen' : 'Menü öffnen'}
                aria-expanded={menuOpen}
              >
                <HamburgerIcon open={menuOpen} />
                <span className="label">
                  {menuOpen ? 'Schliessen' : 'Menü'}
                </span>
              </PillButton>
              {/* Search pill is hidden when the menu is open — fewer focus
                  targets, matches tsri's NavbarHomeLink/Tabs hide-when-open. */}
              <Box
                sx={{
                  visibility: menuOpen ? 'hidden' : 'visible',
                }}
              >
                <PillLink
                  href="/search"
                  aria-label="Suche"
                >
                  <SearchIcon />
                </PillLink>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                visibility: menuOpen ? 'hidden' : 'visible',
              }}
            >
              <LogoLink
                href="/"
                aria-label="ee-news Startseite"
              >
                <LogoMark>
                  ee<LogoAccent>·</LogoAccent>news
                </LogoMark>
                <LogoTagline>Erneuerbare · Effizienz · Schweiz</LogoTagline>
              </LogoLink>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                visibility: menuOpen ? 'hidden' : 'visible',
              }}
            >
              <SupportLink href="/mitmachen">
                <SupportDot aria-hidden />
                Unterstützen
              </SupportLink>
            </Box>
          </MainBar>
          <BottomNavRow
            aria-label="Themen-Navigation"
            menuOpen={menuOpen}
          >
            {NAV_ITEMS.map(item => (
              <BottomNavLink
                key={item.label}
                href={item.href}
                data-label={item.label}
                active={item.isActive(
                  router.pathname,
                  router.query as Record<string, string | string[] | undefined>
                )}
              >
                {item.label}
              </BottomNavLink>
            ))}
          </BottomNavRow>
        </Container>
      </TopbarShell>
      <EenewsMenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navbarProps={props}
      />
    </>
  );
};
