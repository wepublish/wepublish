import { css, CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { ClickAwayListener, Container, GlobalStyles } from '@mui/material';
import { navigationLinkToUrl } from '@wepublish/navigation/website';
import {
  BuilderNavbarProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import chevronDown from '../assets/chevron-down.svg';
import menuIcon from '../assets/menu.svg';
import { staticImageSrc } from '../assets/static-image';
import logo from '../assets/wepublish-logo.svg';
import { designText } from '../theme';
import { primaryButton, tertiaryButton } from './button-styles';
import { HeroWrapper } from './hero/hero';
import { contentWidth, extraColumn } from './page-columns';

// Below this breakpoint the links move into a menu behind a button
const desktop = 'lg';

export const NavbarWrapper = styled('nav')`
  position: relative;
  z-index: 10;
  color: ${({ theme }) => theme.palette.common.black};
`;

export const NavbarBar = styled(Container)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(2.5)};
  padding-bottom: ${({ theme }) => theme.spacing(2.5)};

  ${({ theme }) => theme.breakpoints.up(desktop)} {
    gap: 50px;
    padding-top: 51px;
    // All 12 columns, as wide as the bottom row of the logo band
    max-width: none;
    padding-inline: calc(
      (100% - ${({ theme }) => contentWidth(theme)}) / 2 -
        ${({ theme }) => extraColumn(theme, contentWidth(theme), '100%')}
    );
  }
`;

const aboveMenu = css`
  position: relative;
  z-index: 1;
`;

export const NavbarHomeLink = styled('a')`
  ${aboveMenu}
  display: block;
  line-height: 0;
  margin-right: auto;

  &,
  &:hover {
    text-decoration: none;
  }
`;

export const NavbarLogo = styled('img')`
  width: 140px;
  height: auto;

  ${({ theme }) => theme.breakpoints.up(desktop)} {
    width: 186px;
  }
`;

export const NavbarMenu = styled('div', {
  shouldForwardProp: prop => prop !== 'isOpen',
})<{ isOpen: boolean }>`
  // Small screens: a full screen layer below the bar, only while open
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: fixed;
  inset: 0;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(5)};
  padding: ${({ theme }) => theme.spacing(14, 3, 5)};
  overflow-y: auto;
  background-color: ${({ theme }) => theme.palette.primary.main};

  ${({ theme }) => theme.breakpoints.up(desktop)} {
    display: flex;
    position: static;
    flex-direction: row;
    align-items: center;
    gap: 50px;
    padding: 0;
    overflow: visible;
    background-color: transparent;
  }
`;

export const NavbarLinks = styled('ul')`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;

  ${({ theme }) => theme.breakpoints.up(desktop)} {
    flex-direction: row;
    gap: 50px;
  }
`;

export const NavbarLinkItem = styled('li')`
  border-bottom: 1px solid currentColor;

  ${({ theme }) => theme.breakpoints.up(desktop)} {
    border-bottom: none;
  }
`;

export const NavbarLink = styled('a')`
  ${designText.h3 as CSSObject}
  display: block;
  padding: ${({ theme }) => theme.spacing(2, 0)};
  color: inherit;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: none;
  }

  ${({ theme }) => theme.breakpoints.up(desktop)} {
    ${designText.text as CSSObject}
    padding: 0;
  }
`;

// Black in the menu on small screens, outlined in the bar on desktop
export const NavbarCta = styled('a')`
  ${({ theme }) => primaryButton(theme)}
  align-self: flex-start;

  ${({ theme }) => theme.breakpoints.up(desktop)} {
    ${({ theme }) => tertiaryButton(theme)}
    align-self: auto;
  }
`;

export const LanguageSwitchWrapper = styled('div')`
  ${aboveMenu}
`;

export const LanguageSwitchButton = styled('button')`
  ${({ theme }) => tertiaryButton(theme)}
`;

export const LanguageSwitchChevron = styled('img', {
  shouldForwardProp: prop => prop !== 'isOpen',
})<{ isOpen: boolean }>`
  width: 18px;
  height: 14px;
  transform: rotate(${({ isOpen }) => (isOpen ? 180 : 0)}deg);
`;

export const LanguageSwitchList = styled('ul')`
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 7px;
  list-style: none;
  border: 1.5px solid currentColor;
  border-radius: 3px;
  // The background of what is below: the hero (or the open menu) or the page
  background-color: ${({ theme }) => theme.palette.common.white};

  body:has(${HeroWrapper}) ${NavbarWrapper} &,
  [data-menu-open='true'] & {
    background-color: ${({ theme }) => theme.palette.primary.main};
  }
`;

export const LanguageSwitchLink = styled('a')`
  ${designText.textSmallMono as CSSObject}
  display: block;
  padding: 5px 7px;
  color: inherit;
  text-decoration: none;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

export const MenuButton = styled('button')`
  ${({ theme }) => tertiaryButton(theme)}
  ${aboveMenu}
  justify-content: center;
  width: 41px;
  height: 41px;
  padding: 0;

  ${({ theme }) => theme.breakpoints.up(desktop)} {
    display: none;
  }
`;

export const MenuIcon = styled('img')`
  width: 22px;
  height: auto;
`;

// Two crossed lines in the style of the menu icon
export const CloseIcon = styled('span')`
  position: relative;
  width: 22px;
  height: 22px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: -2px;
    right: -2px;
    border-top: 2px solid currentColor;
    transform: translateY(-50%) rotate(45deg);
  }

  &::after {
    transform: translateY(-50%) rotate(-45deg);
  }
`;

const lockScroll = (
  <GlobalStyles
    styles={theme => ({
      [theme.breakpoints.down(desktop)]: { body: { overflow: 'hidden' } },
    })}
  />
);

export const LanguageSwitch = ({ className }: { className?: string }) => {
  const { locale, locales = [] } = useRouter();
  const [isOpen, setOpen] = useState(false);
  const listId = useId();

  const languages = locales.filter(language => language !== 'default');
  const current = locale && locale !== 'default' ? locale : languages[0];

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === 'Escape' && setOpen(false);

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <LanguageSwitchWrapper className={className}>
        <LanguageSwitchButton
          type="button"
          aria-expanded={isOpen}
          aria-controls={listId}
          onClick={() => setOpen(open => !open)}
        >
          {current?.toUpperCase()}
          <LanguageSwitchChevron
            src={staticImageSrc(chevronDown)}
            alt=""
            isOpen={isOpen}
          />
        </LanguageSwitchButton>

        {isOpen && (
          <LanguageSwitchList id={listId}>
            {languages.map(language => (
              <li key={language}>
                <LanguageSwitchLink
                  href={`/${language}`}
                  aria-current={language === current ? 'true' : undefined}
                >
                  {language.toUpperCase()}
                </LanguageSwitchLink>
              </li>
            ))}
          </LanguageSwitchList>
        )}
      </LanguageSwitchWrapper>
    </ClickAwayListener>
  );
};

/**
 * Shows the links of the navigation `slug`. Its last link is the call to
 * action ("Demo buchen") and is shown as a button.
 */
export const WepNavbar = ({ className, data, slug }: BuilderNavbarProps) => {
  const { t } = useTranslation();
  const {
    elements: { Link },
  } = useWebsiteBuilder();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const links = data?.navigations?.find(({ key }) => key === slug)?.links ?? [];
  const entries = links.slice(0, -1);
  const callToAction = links.at(-1);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === 'Escape' && setMenuOpen(false);

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <NavbarWrapper
      className={className}
      data-menu-open={isMenuOpen}
    >
      {isMenuOpen && lockScroll}

      <NavbarBar maxWidth="lg">
        <NavbarHomeLink
          as={Link}
          href="/"
        >
          <NavbarLogo
            src={staticImageSrc(logo)}
            alt="WePublish Logo"
          />
        </NavbarHomeLink>

        <NavbarMenu
          id={menuId}
          isOpen={isMenuOpen}
        >
          <NavbarLinks>
            {entries.map((link, index) => (
              <NavbarLinkItem key={index}>
                <NavbarLink
                  as={Link}
                  href={navigationLinkToUrl(link)}
                  onClick={closeMenu}
                >
                  {link.label}
                </NavbarLink>
              </NavbarLinkItem>
            ))}
          </NavbarLinks>

          {callToAction && (
            <NavbarCta
              as={Link}
              href={navigationLinkToUrl(callToAction)}
              onClick={closeMenu}
            >
              {callToAction.label}
            </NavbarCta>
          )}
        </NavbarMenu>

        <LanguageSwitch />

        <MenuButton
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          aria-label={t(isMenuOpen ? 'navbar.closeMenu' : 'navbar.openMenu')}
          onClick={() => setMenuOpen(open => !open)}
        >
          {isMenuOpen ?
            <CloseIcon />
          : <MenuIcon
              src={staticImageSrc(menuIcon)}
              alt=""
            />
          }
        </MenuButton>
      </NavbarBar>
    </NavbarWrapper>
  );
};
