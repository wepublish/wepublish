import styled from '@emotion/styled';
import { css, Typography } from '@mui/material';
import {
  FullNavigationFragment,
  NavigationListQuery,
} from '@wepublish/website/api';
import { BuilderNavbarProps, Link } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MdClose, MdMenu, MdSearch } from 'react-icons/md';

import { Advertisement } from './advertisement';
import { EenewsMegaMenu } from './eenews-mega-menu';

const navigationLinkToUrl = (
  link: FullNavigationFragment['links'][number]
): string | undefined => {
  switch (link.__typename) {
    case 'ArticleNavigationLink':
      return link.article?.url;
    case 'PageNavigationLink':
      return link.page?.url;
    case 'ExternalNavigationLink':
      return link.url ?? undefined;
  }
};

const formatDateDE = (d: Date) =>
  d.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const findNavBySlug = (
  data: NavigationListQuery | undefined,
  key: string
): FullNavigationFragment | undefined =>
  data?.navigations?.find(n => n.key === key) ?? undefined;

const Header = styled('header', {
  shouldForwardProp: p => p !== 'isOpen' && p !== 'isAnimating',
})<{ isOpen: boolean; isAnimating: boolean }>`
  position: sticky;
  top: 0;
  z-index: 30;
  background: ${({ theme }) => theme.palette.background.default};
`;

const TopBar = styled('div', {
  shouldForwardProp: p => p !== 'isScrolled',
})<{ isScrolled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 56px 14px;
  border-bottom: 1.5px solid ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.main};
  max-height: 200px;
  overflow: hidden;
  opacity: 1;
  transition:
    max-height 0.35s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.3s ease,
    padding 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);

  ${({ isScrolled }) =>
    isScrolled &&
    css`
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
      opacity: 0;
      border-bottom-color: transparent;
      pointer-events: none;
    `}

  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 10px 20px;
    font-size: 13px;
    flex-wrap: wrap;
    gap: 10px;
  }
`;

const TopBarLeft = styled('span')``;

const TopBarRight = styled('span')`
  display: inline-flex;
  gap: 10px;
  align-items: center;
`;

const TopBarSep = styled('span')`
  opacity: 0.5;
`;

const TopBarLink = styled(Link)`
  color: ${({ theme }) => theme.palette.primary.main};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const InvoicePill = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.palette.error.main};
  color: ${({ theme }) => theme.palette.background.paper};
  text-transform: none;
  text-decoration: none;
  &:hover {
    background: ${({ theme }) => theme.palette.error.dark};
    text-decoration: none;
  }
`;

const InvoiceDot = styled('span')`
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: ${({ theme }) => theme.palette.background.paper};
  animation: pulse-dot 1.6s infinite;

  @keyframes pulse-dot {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
  }
`;

const Hero = styled('div', {
  shouldForwardProp: p => p !== 'isAnimating' && p !== 'isOpen',
})<{ isAnimating: boolean; isOpen: boolean }>`
  position: relative;
  background-image: linear-gradient(
    90deg,
    #b6e9a8 0%,
    #abe1b5 35%,
    #98d6c0 65%,
    #84cdc4 100%
  );
  border-bottom: 1.5px solid ${({ theme }) => theme.palette.primary.main};
  transition: border-bottom-color 0.3s ease;
  ${({ isOpen, isAnimating }) =>
    (isOpen || isAnimating) &&
    css`
      border-bottom-color: transparent;
      transition: border-bottom-color 0.04s ease;
    `}
`;

const HeroInner = styled('div', {
  shouldForwardProp: p => p !== 'isScrolled',
})<{ isScrolled?: boolean }>`
  max-width: calc(var(--max-width) + var(--skycraper-width));
  margin: 0 auto;
  padding: 0 56px;
  display: flex;
  flex-direction: column;
  min-height: 230px;
  transition: min-height 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);

  ${({ isScrolled }) =>
    isScrolled &&
    css`
      min-height: 95px;
      justify-content: center;
    `}

  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 0 20px;
  }
`;

const HeroRow = styled('div', {
  shouldForwardProp: p => p !== 'isScrolled',
})<{ isScrolled?: boolean }>`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 38px 0 28px;
  transition: padding 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);

  ${({ isScrolled }) =>
    isScrolled &&
    css`
      padding: 0;
    `}

  ${({ theme }) => theme.breakpoints.down('md')} {
    grid-template-columns: auto 1fr auto;
    padding: 16px 0 12px;
  }
`;

const HeroActions = styled('div')`
  display: inline-flex;
  gap: 12px;
  align-items: center;
`;

const HeroActionsRight = styled(HeroActions)`
  justify-content: flex-end;
`;

const IconBtn = styled('button', {
  shouldForwardProp: p => p !== 'isActive',
})<{ isActive?: boolean }>`
  width: 42px;
  height: 42px;
  border-radius: 6px;
  border: 2px solid ${({ theme }) => theme.palette.primary.main};
  background: ${({ theme, isActive }) =>
    isActive ? theme.palette.primary.main : 'transparent'};
  color: ${({ theme, isActive }) =>
    isActive ? theme.palette.secondary.main : theme.palette.primary.main};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 120ms ease;
  &:hover {
    background: ${({ theme, isActive }) =>
      isActive ? theme.palette.primary.main : 'rgba(255,255,255,0.45)'};
  }
`;

const IconBtnLink = styled(Link)`
  width: 42px;
  height: 42px;
  border-radius: 6px;
  border: 2px solid ${({ theme }) => theme.palette.primary.main};
  background: transparent;
  color: ${({ theme }) => theme.palette.primary.main};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: background 120ms ease;
  &:hover {
    background: rgba(255, 255, 255, 0.45);
  }
`;

const SupportBtn = styled(Link)`
  height: 42px;
  padding: 0 22px;
  border-radius: 6px;
  border: 2px solid ${({ theme }) => theme.palette.primary.main};
  background: transparent;
  color: ${({ theme }) => theme.palette.primary.main};
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  transition: all 120ms ease;
  &:hover {
    background: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.background.paper};
  }
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 0 14px;
  }
`;

const LogoLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: ${({ theme }) => theme.palette.primary.main};
  background: none;
  border: 0;
  padding: 0;
  position: relative;
  z-index: 6;
`;

const LogoImg = styled('img', {
  shouldForwardProp: p => p !== 'isScrolled',
})<{ isScrolled?: boolean }>`
  width: 240px;
  height: auto;
  display: block;
  transition: width 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);

  ${({ isScrolled }) =>
    isScrolled &&
    css`
      width: 180px;
    `}

  ${({ theme }) => theme.breakpoints.down('md')} {
    width: 180px;
  }
`;

const BottomNav = styled('nav', {
  shouldForwardProp: p => p !== 'isOpen' && p !== 'isScrolled',
})<{ isOpen: boolean; isScrolled?: boolean }>`
  display: flex;
  gap: 44px;
  justify-content: space-between;
  align-items: center;
  width: 1023px;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 0 12px;
  max-height: 50px;
  opacity: 1;
  overflow: hidden;
  transition:
    max-height 0.35s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.45s ease 0.15s,
    padding 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);

  ${({ isScrolled }) =>
    isScrolled &&
    css`
      max-height: 0;
      padding: 0;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    `}

  ${({ isOpen }) =>
    isOpen &&
    css`
      visibility: hidden;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    `}

  ${({ theme }) => theme.breakpoints.down('md')} {
    gap: 28px;
    flex-wrap: wrap;
    justify-content: center;
  }
  ${({ theme }) => theme.breakpoints.down('sm')} {
    display: none;
  }
`;

const NavLink = styled(Link, {
  shouldForwardProp: p => p !== 'isActive',
})<{ isActive: boolean }>`
  background: none;
  border: 0;
  padding: 0;
  color: ${({ theme }) => theme.palette.primary.main};
  font-weight: ${({ isActive }) => (isActive ? 700 : 300)};
  font-size: 22px;
  letter-spacing: -0.005em;
  transition: opacity 120ms ease;
  text-decoration: none;
  &:hover {
    opacity: 0.7;
  }
  ${({ theme }) => theme.breakpoints.down('md')} {
    font-size: 18px;
  }
`;

const LeaderboardPlacer = styled('div')``;

export const EenewsNavbar = ({
  className,
  slug,
  headerSlug,
  categorySlugs,
  data,
  hasUnpaidInvoices,
  children,
}: BuilderNavbarProps) => {
  const router = useRouter();
  const navbarRef = useRef<HTMLElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [today, setToday] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setToday(formatDateDE(new Date()));
  }, []);

  // Collapse the hero into a slim strip (and fade out the nav) once the page is
  // scrolled; the top bar always stays visible. Mirrors the tsri/hauptstadt pattern.
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 1);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const updateNavbarHeight = useCallback(() => {
    const el = navbarRef.current;
    if (!el) {
      return;
    }
    el.ownerDocument.documentElement.style.setProperty(
      '--navbar-height',
      `${el.getBoundingClientRect().height}px`
    );
  }, []);

  useEffect(() => {
    const el = navbarRef.current;
    if (!el) {
      return;
    }

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateNavbarHeight());
      observer.observe(el);
      return () => observer.disconnect();
    }

    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);
    return () => window.removeEventListener('resize', updateNavbarHeight);
  }, [updateNavbarHeight]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    router.events.on('routeChangeComplete', close);
    return () => router.events.off('routeChangeComplete', close);
  }, [router.events, close]);

  const onToggle = () => {
    setOpen(o => !o);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 280);
  };

  const mainNav = useMemo(() => findNavBySlug(data, slug), [data, slug]);
  const headerNav = useMemo(
    () => findNavBySlug(data, headerSlug),
    [data, headerSlug]
  );
  const newsletterLink = headerNav?.links.find(l =>
    /newsletter/i.test(l.label)
  );
  const profileLink = headerNav?.links.find(l =>
    /(mein konto|profil|konto)/i.test(l.label)
  );

  const supportLink = mainNav?.links.find(l =>
    /unterst|dossier/i.test(l.label)
  );
  const isActiveUrl = (url: string | undefined): boolean => {
    if (!url) {
      return false;
    }
    const path = router.asPath.split(/[?#]/)[0];
    return path === url || path.startsWith(url + '/');
  };

  const tagSlugFromPath = (path: string): string | undefined => {
    const match = path.match(/^\/a\/tag\/(.+)$/);
    return match ? decodeURIComponent(match[1]).toLowerCase() : undefined;
  };
  const topicSlugs = new Set(
    (mainNav?.links ?? [])
      .map(l => {
        const u = navigationLinkToUrl(l);
        return u ? tagSlugFromPath(u) : undefined;
      })
      .filter((s): s is string => Boolean(s))
  );
  const isDossierActive = (): boolean => {
    const path = router.asPath.split(/[?#]/)[0];
    if (path === '/a/tag') {
      return true;
    }
    const slug = tagSlugFromPath(path);
    return slug ? !topicSlugs.has(slug) : false;
  };

  return (
    <Header
      ref={navbarRef}
      className={className}
      isOpen={isOpen}
      isAnimating={animating}
    >
      <TopBar isScrolled={isScrolled}>
        <TopBarLeft>
          <Typography
            variant="topbarDate"
            component="span"
          >
            {today}
          </Typography>
        </TopBarLeft>
        <LeaderboardPlacer>
          <Advertisement type={'leaderboard'} />
        </LeaderboardPlacer>
        <TopBarRight>
          {hasUnpaidInvoices && (
            <InvoicePill
              href="/profile#offene-rechnungen"
              title="Offene Rechnung"
            >
              <InvoiceDot />
              <Typography
                variant="topbarInvoicePill"
                component="span"
              >
                Offene Rechnung
              </Typography>
            </InvoicePill>
          )}
          {newsletterLink && navigationLinkToUrl(newsletterLink) && (
            <TopBarLink href={navigationLinkToUrl(newsletterLink) as string}>
              <Typography
                variant="topbarLink"
                component="span"
              >
                {newsletterLink.label}
              </Typography>
            </TopBarLink>
          )}
          {profileLink && navigationLinkToUrl(profileLink) && (
            <>
              <TopBarSep>·</TopBarSep>
              <TopBarLink href={navigationLinkToUrl(profileLink) as string}>
                <Typography
                  variant="topbarLink"
                  component="span"
                >
                  {profileLink.label}
                </Typography>
              </TopBarLink>
            </>
          )}
        </TopBarRight>
      </TopBar>

      <Hero
        isAnimating={animating}
        isOpen={isOpen}
      >
        <HeroInner isScrolled={isScrolled}>
          <HeroRow isScrolled={isScrolled}>
            <HeroActions>
              <IconBtn
                type="button"
                onClick={onToggle}
                isActive={isOpen}
                aria-label={isOpen ? 'Menü schliessen' : 'Menü öffnen'}
                aria-expanded={isOpen}
              >
                {isOpen ?
                  <MdClose size={22} />
                : <MdMenu size={22} />}
              </IconBtn>
              <IconBtnLink
                href="/search"
                aria-label="Suchen"
              >
                <MdSearch size={22} />
              </IconBtnLink>
            </HeroActions>

            <LogoLink
              href="/"
              aria-label="Zur Startseite"
            >
              <LogoImg
                src="/ee-news-logo.png"
                alt="ee-news"
                isScrolled={isScrolled}
              />
            </LogoLink>

            <HeroActionsRight>
              <SupportBtn href="/mitmachen">
                <Typography
                  variant="supportBtn"
                  component="span"
                >
                  Unterstützen
                </Typography>
              </SupportBtn>
            </HeroActionsRight>
          </HeroRow>

          <BottomNav
            isOpen={isOpen}
            isScrolled={isScrolled}
          >
            {mainNav?.links.map((link, idx) => {
              const url = navigationLinkToUrl(link);
              if (!url) {
                return null;
              }
              const isActive =
                url === '/a/tag' ? isDossierActive() : isActiveUrl(url);
              return (
                <NavLink
                  key={`${link.label}-${idx}`}
                  href={url}
                  isActive={isActive}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </BottomNav>
        </HeroInner>

        <EenewsMegaMenu
          isOpen={isOpen}
          isScrolled={isScrolled}
          data={data}
          categorySlugs={categorySlugs}
        />
      </Hero>

      {children}
      {supportLink ? null : null}
    </Header>
  );
};
