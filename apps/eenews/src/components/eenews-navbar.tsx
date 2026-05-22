import styled from '@emotion/styled';
import { css, Typography } from '@mui/material';
import {
  FullNavigationFragment,
  NavigationListQuery,
} from '@wepublish/website/api';
import { BuilderNavbarProps, Link } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdClose, MdMenu, MdSearch } from 'react-icons/md';

import { eenewsColors } from '../theme';
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
  background: ${eenewsColors.bg};
`;

const TopBar = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 56px;
  border-bottom: 1.5px solid ${eenewsColors.accent};
  color: ${eenewsColors.accent};

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
  color: ${eenewsColors.accent};
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
  background: ${eenewsColors.alert};
  color: ${eenewsColors.white};
  text-transform: none;
  text-decoration: none;
  &:hover {
    background: ${eenewsColors.alertDeep};
    text-decoration: none;
  }
`;

const InvoiceDot = styled('span')`
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: ${eenewsColors.white};
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

const Hero = styled('div')<{ isAnimating: boolean }>`
  position: relative;
  background-image: linear-gradient(
    90deg,
    #b6e9a8 0%,
    #abe1b5 35%,
    #98d6c0 65%,
    #84cdc4 100%
  );
  border-bottom: 1.5px solid ${eenewsColors.accent};
  transition: border-bottom-color 0.12s ease;
  ${({ isAnimating }) =>
    isAnimating &&
    css`
      border-bottom-color: transparent;
    `}
`;

const HeroInner = styled('div')`
  max-width: 1340px;
  margin: 0 auto;
  padding: 0 56px;
  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 0 20px;
  }
`;

const HeroRow = styled('div')`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 22px 0 16px;

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
  border: 2px solid ${eenewsColors.accent};
  background: ${({ isActive }) =>
    isActive ? eenewsColors.accent : 'transparent'};
  color: ${({ isActive }) =>
    isActive ? eenewsColors.tag : eenewsColors.accent};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 120ms ease;
  &:hover {
    background: ${({ isActive }) =>
      isActive ? eenewsColors.accent : 'rgba(255,255,255,0.45)'};
  }
`;

const IconBtnLink = styled(Link)`
  width: 42px;
  height: 42px;
  border-radius: 6px;
  border: 2px solid ${eenewsColors.accent};
  background: transparent;
  color: ${eenewsColors.accent};
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
  border: 2px solid ${eenewsColors.accent};
  background: transparent;
  color: ${eenewsColors.accent};
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  transition: all 120ms ease;
  &:hover {
    background: ${eenewsColors.accent};
    color: ${eenewsColors.white};
  }
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 0 14px;
  }
`;

const LogoLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: ${eenewsColors.accent};
  background: none;
  border: 0;
  padding: 0;
  position: relative;
  z-index: 6;
`;

const LogoImg = styled('img')`
  width: 240px;
  height: auto;
  display: block;
  ${({ theme }) => theme.breakpoints.down('md')} {
    width: 180px;
  }
`;

const BottomNav = styled('nav', {
  shouldForwardProp: p => p !== 'isOpen',
})<{ isOpen: boolean }>`
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
  color: ${eenewsColors.accent};
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
  const [isOpen, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [today, setToday] = useState<string>('');

  useEffect(() => {
    setToday(formatDateDE(new Date()));
  }, []);

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
    return router.asPath === url || router.asPath.startsWith(url + '/');
  };

  return (
    <Header
      className={className}
      isOpen={isOpen}
      isAnimating={animating}
    >
      <TopBar>
        <TopBarLeft>
          <Typography
            variant="topbarDate"
            component="span"
          >
            {today}
          </Typography>
        </TopBarLeft>
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

      <Hero isAnimating={animating}>
        <HeroInner>
          <HeroRow>
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

          <BottomNav isOpen={isOpen}>
            {mainNav?.links.map((link, idx) => {
              const url = navigationLinkToUrl(link);
              if (!url) {
                return null;
              }
              return (
                <NavLink
                  key={`${link.label}-${idx}`}
                  href={url}
                  isActive={isActiveUrl(url)}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </BottomNav>
        </HeroInner>

        <EenewsMegaMenu
          isOpen={isOpen}
          data={data}
          categorySlugs={categorySlugs}
        />
      </Hero>

      {children}
      {supportLink ? null : null}
    </Header>
  );
};
