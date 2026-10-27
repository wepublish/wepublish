import styled from '@emotion/styled';
import { AppBar, Box, css, Theme, Toolbar } from '@mui/material';
import { useUser } from '@wepublish/authentication/website';
import { navigationLinkToUrl } from '@wepublish/navigation/website';
import { ButtonProps } from '@wepublish/ui';
import {
  FullImageFragment,
  FullNavigationFragment,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { PropsWithChildren, ReactNode } from 'react';
import {
  MdAccountCircle,
  MdClose,
  MdMenu,
  MdOutlinePayments,
} from 'react-icons/md';

import { UseToggle } from '../use-toggle';

export type BuilderNavAppBarProps = PropsWithChildren<{
  loginBtn?: ButtonProps | null;
  profileBtn?: ButtonProps | null;
  subscribeBtn?: ButtonProps | null;
  logo?: FullImageFragment | null;
  headerItems: FullNavigationFragment | null | undefined;
  menuToggle: UseToggle;
  actions?: ReactNode;
}>;

export const NavAppBar = ({
  logo,
  loginBtn,
  profileBtn,
  subscribeBtn,
  headerItems,
  menuToggle,
  actions,
}: BuilderNavAppBarProps) => {
  return (
    <AppBar
      position="static"
      elevation={0}
      color={'transparent'}
      css={appBarStyles(menuToggle.value)}
    >
      <NavbarInnerWrapper>
        <NavbarMain>
          <NavbarIconButtonWrapper>
            <NavbarOpenCloseButton toggle={menuToggle} />
          </NavbarIconButtonWrapper>
          {!!headerItems?.links.length && (
            <NavbarLinks isMenuOpen={menuToggle.value}>
              <MenuItems items={headerItems} />
            </NavbarLinks>
          )}
        </NavbarMain>

        <HomeLogoButton
          logo={logo}
          menuToggle={menuToggle}
        />
        <NavbarActions isMenuOpen={menuToggle.value}>
          {actions}
          <LoggedInButtons
            profileBtn={profileBtn}
            subscribeBtn={subscribeBtn}
          />
          <LoggedOutButtons loginBtn={loginBtn} />
        </NavbarActions>
      </NavbarInnerWrapper>
    </AppBar>
  );
};

type HomeLogoButton = Pick<BuilderNavAppBarProps, 'logo' | 'menuToggle'> & {
  className?: string;
};

export const HomeLogoButton = ({
  logo,
  menuToggle,
  className,
}: HomeLogoButton) => {
  const {
    elements: { Link, Image },
  } = useWebsiteBuilder();
  return (
    <Link
      href="/"
      aria-label="Startseite"
      css={logoLinkStyles(menuToggle.value)}
      className={className}
    >
      <NavbarLogoWrapper>
        {!!logo && (
          <Image
            image={logo}
            css={imageStyles}
            loading="eager"
            fetchPriority="high"
          />
        )}
      </NavbarLogoWrapper>
    </Link>
  );
};

type LoggedInButtonsProps = Pick<
  BuilderNavAppBarProps,
  'subscribeBtn' | 'profileBtn'
>;

export const LoggedInButtons = ({
  subscribeBtn,
  profileBtn,
}: LoggedInButtonsProps) => {
  const { hasUser } = useUser();
  const {
    elements: { Link, IconButton },
  } = useWebsiteBuilder();

  if (!hasUser) {
    return <></>;
  }
  return (
    <>
      {subscribeBtn && (
        <Link href={subscribeBtn?.href}>
          <IconButton css={{ fontSize: '2em', color: 'black' }}>
            <MdOutlinePayments aria-label={'Subscriptions'} />
          </IconButton>
        </Link>
      )}
      {profileBtn && (
        <Link href={profileBtn?.href}>
          <IconButton
            className="login-button"
            css={{ fontSize: '2em', color: 'black' }}
          >
            <MdAccountCircle aria-label="Profil" />
          </IconButton>
        </Link>
      )}
    </>
  );
};

type LoggedOutButtonsProps = Pick<BuilderNavAppBarProps, 'loginBtn'>;

export const LoggedOutButtons = ({ loginBtn }: LoggedOutButtonsProps) => {
  const { hasUser } = useUser();
  const {
    elements: { Link, IconButton },
  } = useWebsiteBuilder();

  if (hasUser) {
    return <></>;
  }
  return (
    <>
      {loginBtn && (
        <Link href={loginBtn?.href}>
          <IconButton
            className="login-button"
            css={{ fontSize: '2em', color: 'black' }}
          >
            <MdAccountCircle aria-label="Login" />
          </IconButton>
        </Link>
      )}
    </>
  );
};

type MenuItemsProps = {
  items: FullNavigationFragment | null | undefined;
};

export const MenuItems = ({ items }: MenuItemsProps) => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();
  return (
    <>
      {items?.links.map((link, index) => (
        <Link
          key={index}
          href={navigationLinkToUrl(link)}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
};

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
`;

export const NavbarLinks = styled('div')<{ isMenuOpen?: boolean }>`
  display: none;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
  justify-content: flex-start;
  width: 100%;

  ${({ isMenuOpen }) =>
    isMenuOpen &&
    css`
      z-index: -1;
    `} @media (
  min-width: 740px) {
    // custom for maximum space usage
    display: flex;

    a {
      font-size: 1rem;
      text-decoration: none;
      color: ${({ theme }) => theme.palette.common.black};

      ${({ theme }) => theme.breakpoints.up('md')} {
        font-size: 1.3rem;
      }
    }
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

export const NavbarActions = styled(Box)<{ isMenuOpen?: boolean }>`
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

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-right: 0;
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

const logoLinkStyles = (isMenuOpen: boolean) => (theme: Theme) => css`
  color: unset;
  display: grid;
  align-items: center;
  justify-items: center;
  justify-self: center;
  ${isMenuOpen &&
  css`
    z-index: -1;
  `}
`;

export const NavbarLogoWrapper = styled('div')`
  fill: currentColor;

  img {
    width: auto;
  }
`;

const imageStyles = (theme: Theme) => css`
  max-height: ${theme.spacing(6)};
  max-width: ${theme.spacing(38)};

  ${theme.breakpoints.up('md')} {
    max-height: ${theme.spacing(8)};
    max-width: ${theme.spacing(38)};
    margin: ${theme.spacing(2)} 0;
  }
`;

type NavbarOpenCloseButtonProps = {
  toggle: UseToggle;
};

export const NavbarOpenCloseButton = ({
  toggle,
}: NavbarOpenCloseButtonProps) => {
  const {
    elements: { IconButton },
  } = useWebsiteBuilder();
  return (
    <IconButton
      size="large"
      aria-label="Menu"
      onClick={toggle.toggle}
      color={'inherit'}
    >
      {!toggle.value && <MdMenu />}
      {toggle.value && <MdClose />}
    </IconButton>
  );
};
