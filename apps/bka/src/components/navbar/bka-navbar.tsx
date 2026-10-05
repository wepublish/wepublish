import styled from '@emotion/styled';
import { navigationLinkToUrl } from '@wepublish/navigation/website';
import {
  BuilderNavbarProps,
  IconButton,
  Link,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import { MdClose, MdMenu, MdOpenInNew } from 'react-icons/md';

import { BkaLogo } from './bka-logo';
import { FaPlus } from 'react-icons/fa6';

const isExternalHref = (href?: string) => !!href && /^https?:\/\//.test(href);

export const BkaNavbarWrapper = styled('nav')`
  display: grid;
  grid-template-rows: auto;
  background-color: ${({ theme }) => theme.palette.background.default};

  ${({ theme }) => theme.breakpoints.up('md')} {
    position: fixed;
    inset: 0 auto 0 0;
    width: var(--bka-sidebar-width);
    padding: ${({ theme }) => theme.spacing(2)};
    grid-template-rows: minmax(0, 1fr);
    overflow-y: auto;
    z-index: 10;
  }
`;

export const BkaNavbarBar = styled('div')`
  display: flex;
  align-items: center;
  min-height: 60px;
  padding: ${({ theme }) => theme.spacing(0.875, 1)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};

  ${({ theme }) => theme.breakpoints.up('md')} {
    display: none;
  }
`;

export const BkaNavbarBarLogo = styled(Link)`
  display: block;
  width: min(219px, 56vw);
  color: inherit;
  text-decoration: none;
`;

export const BkaNavbarBeta = styled('img')`
  display: block;
  flex-shrink: 0;
  width: 31px;
  height: auto;
  margin-left: auto;
`;

export const BkaNavbarContent = styled('div', {
  shouldForwardProp: prop => prop !== 'isMenuOpen',
})<{ isMenuOpen: boolean }>`
  display: ${({ isMenuOpen }) => (isMenuOpen ? 'flex' : 'none')};
  flex-direction: column;
  align-content: start;
  min-height: calc(100vh - 60px);
  padding: ${({ theme }) => theme.spacing(7.5)}
    ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(2)};
  text-align: center;

  ${({ theme }) => theme.breakpoints.up('md')} {
    min-height: 0;
    padding: 0;
    text-align: start;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
  }
`;

export const BkaMainLinks = styled('ul')`
  display: grid;
  align-content: start;
  list-style: none;
  margin-block: -${({ theme }) => theme.spacing(0.5)};
  margin-inline: 0;
  padding: 0;
`;

export const BkaMainLink = styled(Link, {
  shouldForwardProp: prop => prop !== 'isActive',
})<{ isActive?: boolean }>`
  display: block;
  padding: ${({ theme }) => theme.spacing(0.5)} 0;
  color: ${({ theme, isActive }) =>
    isActive ? theme.palette.grey[600] : theme.palette.text.primary};
  text-decoration: none;
  font-family: ${({ theme }) => theme.typography.body1.fontFamily};
  font-weight: 400;
  font-size: 2.8125rem;
  line-height: 1;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 2.1875rem;
  }

  &:hover,
  &:focus {
    color: ${({ theme }) => theme.palette.grey[600]};
    text-decoration: none;
  }
`;

export const BkaSecondaryLink = styled(Link)`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding-block: ${({ theme }) => theme.spacing(0.5)};
  color: ${({ theme }) => theme.palette.text.primary};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  line-height: 1.3;

  &:hover,
  &:focus {
    color: ${({ theme }) => theme.palette.grey[600]};
    text-decoration: none;
  }
`;

export const BkaSecondaryLinks = styled('ul')`
  display: grid;
  align-content: start;
  list-style: none;
  margin: 0;
  padding: 0;

  & + & {
    margin-top: auto;
    flex-direction: row;
    justify-content: space-around;
    grid-auto-flow: column;

    ${BkaSecondaryLink} {
      padding-block: ${({ theme }) => theme.spacing(1)};
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-auto-flow: row;
      justify-content: normal;
      margin-top: ${({ theme }) => theme.spacing(2.5)};
    }
  }
`;

export const BkaActionIcon = styled(FaPlus)`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
`;

export const BkaActionLabel = styled('span')`
  display: block;
  max-width: 233px;
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
  font-weight: 700;
  line-height: ${({ theme }) => theme.typography.h6.lineHeight};
  text-decoration: none;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: ${({ theme }) => theme.typography.body2.fontSize};
    line-height: ${({ theme }) => theme.typography.body2.lineHeight};
    max-width: 7rem;
  }
`;

export const BkaActionLink = styled(Link)`
  display: inline-flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.palette.text.primary};
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
  line-height: ${({ theme }) => theme.typography.h6.lineHeight};
  text-decoration: none;

  ${({ theme }) => theme.breakpoints.up('md')} {
    flex-direction: row;
    gap: ${({ theme }) => theme.spacing(1)};
    font-size: ${({ theme }) => theme.typography.body1.fontSize};
  }

  &:hover,
  &:focus {
    text-decoration: none;

    ${BkaActionLabel} {
      text-decoration: underline;
    }
  }
`;

export const BkaActionLinks = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-block: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    align-items: stretch;
    padding-block: ${({ theme }) => theme.spacing(4)};
  }
`;

export const BkaLogoLink = styled(Link)`
  display: none;
  width: 100%;
  max-width: 170px;
  color: inherit;

  ${({ theme }) => theme.breakpoints.up('md')} {
    display: block;
    margin-top: auto;
    margin-bottom: ${({ theme }) => theme.spacing(1)};
    padding-top: ${({ theme }) => theme.spacing(4)};
  }
`;

export const BkaBurger = styled(IconButton)`
  flex-shrink: 0;
  width: 26px;
  height: 20px;
  margin-left: ${({ theme }) => theme.spacing(3)};
  margin-right: ${({ theme }) => theme.spacing(2)};
  padding: 0;
  border-radius: 0;
  color: ${({ theme }) => theme.palette.text.primary};

  ${({ theme }) => theme.breakpoints.up('md')} {
    display: none;
  }
`;

const toPathname = (href?: string) => {
  if (!href) {
    return undefined;
  }

  try {
    return new URL(href, 'http://localhost').pathname.replace(/\/$/, '');
  } catch {
    return href;
  }
};

export const BkaNavbar = ({
  className,
  data,
  slug,
  iconSlug,
  categorySlugs,
  children,
}: BuilderNavbarProps) => {
  const { asPath } = useRouter();
  const currentPath = toPathname(asPath);

  const [isMenuOpen, setMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setMenuOpen(open => !open), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const mainNav = useMemo(
    () => data?.navigations?.find(({ key }) => key === slug),
    [data?.navigations, slug]
  );

  const actionNav = useMemo(
    () => data?.navigations?.find(({ key }) => key === iconSlug),
    [data?.navigations, iconSlug]
  );

  const categories = useMemo(
    () =>
      categorySlugs.map(group =>
        group.flatMap(key => {
          const nav = data?.navigations?.find(
            navigation => navigation.key === key
          );
          return nav ? [nav] : [];
        })
      ),
    [categorySlugs, data?.navigations]
  );

  return (
    <BkaNavbarWrapper className={className}>
      <BkaNavbarBar>
        <BkaNavbarBarLogo
          href="/"
          aria-label="Startseite"
        >
          <BkaLogo
            alt=""
            variant="horizontal"
          />
        </BkaNavbarBarLogo>

        <BkaNavbarBeta
          src="/logo-beta.svg"
          alt="Beta"
          width={31}
          height={18}
        />

        <BkaBurger
          type="button"
          aria-label="Menu"
          aria-expanded={isMenuOpen}
          onClick={toggleMenu}
        >
          {isMenuOpen ?
            <MdClose size={26} />
          : <MdMenu size={26} />}
        </BkaBurger>
      </BkaNavbarBar>

      <BkaNavbarContent isMenuOpen={isMenuOpen}>
        <BkaMainLinks>
          {mainNav?.links.map((link, index) => {
            const href = navigationLinkToUrl(link);

            return (
              <li key={index}>
                <BkaMainLink
                  href={href}
                  onClick={closeMenu}
                  isActive={!!currentPath && toPathname(href) === currentPath}
                  aria-current={
                    !!currentPath && toPathname(href) === currentPath ?
                      'page'
                    : undefined
                  }
                >
                  {link.label}
                </BkaMainLink>
              </li>
            );
          })}
        </BkaMainLinks>

        {!!actionNav?.links.length && (
          <BkaActionLinks>
            {actionNav.links.map((link, index) => (
              <BkaActionLink
                key={index}
                href={navigationLinkToUrl(link)}
                onClick={closeMenu}
              >
                <BkaActionIcon />
                <BkaActionLabel>{link.label}</BkaActionLabel>
              </BkaActionLink>
            ))}
          </BkaActionLinks>
        )}

        {categories.map((group, groupIndex) => (
          <BkaSecondaryLinks key={groupIndex}>
            {group.flatMap(nav =>
              nav.links.map(link => {
                const href = navigationLinkToUrl(link);
                const external = isExternalHref(href);

                return (
                  <li key={nav.id}>
                    <BkaSecondaryLink
                      href={href}
                      onClick={closeMenu}
                      {...(external ?
                        { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    >
                      {link.label}
                      {external && (
                        <MdOpenInNew
                          size={14}
                          aria-hidden
                        />
                      )}
                    </BkaSecondaryLink>
                  </li>
                );
              })
            )}
          </BkaSecondaryLinks>
        ))}

        {children}

        <BkaLogoLink
          href="/"
          aria-label="Startseite"
        >
          <BkaLogo />
        </BkaLogoLink>
      </BkaNavbarContent>
    </BkaNavbarWrapper>
  );
};
