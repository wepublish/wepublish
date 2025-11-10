import styled from '@emotion/styled';
import { css, Theme, useTheme } from '@mui/material';
import { useUser } from '@wepublish/authentication/website';
import { navigationLinkToUrl } from '@wepublish/navigation/website';
import { ButtonProps, TextToIcon } from '@wepublish/ui';
import { FullNavigationFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { PropsWithChildren } from 'react';

export type BuilderNavPaperProps = PropsWithChildren<{
  loginBtn?: ButtonProps | null;
  profileBtn?: ButtonProps | null;
  subscribeBtn?: ButtonProps | null;
  main: FullNavigationFragment | null | undefined;
  categories: FullNavigationFragment[][];
  iconItems: FullNavigationFragment | null | undefined;
  closeMenu: () => void;
}>;

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

export const NavPaperName = styled('div')`
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
      grid-template-columns: 1fr 1fr;
    }
  `}
`;

export const navPaperLinkStyling = (theme: Theme) => css`
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
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(5)};
`;

export const NavPaper = ({
  main,
  categories,
  loginBtn,
  profileBtn,
  subscribeBtn,
  closeMenu,
  children,
  iconItems,
}: BuilderNavPaperProps) => {
  const {
    elements: { Link, Button, H4, H6 },
  } = useWebsiteBuilder();
  const { hasUser, logout } = useUser();
  const theme = useTheme();

  return (
    <NavPaperWrapper>
      {children && (
        <NavPaperChildrenWrapper>
          {iconItems?.links.map((link, index) => {
            const url = navigationLinkToUrl(link);

            return (
              <Link
                key={index}
                href={url}
                color="inherit"
              >
                <TextToIcon
                  title={link.label}
                  size={32}
                />
              </Link>
            );
          })}
          {children}
        </NavPaperChildrenWrapper>
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
        <MemberButtons
          loginBtn={loginBtn}
          subscribeBtn={subscribeBtn}
          profileBtn={profileBtn}
          closeMenu={closeMenu}
        />
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
                          css={{ fontWeight: '700' }}
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

export const MemberButtons = ({
  loginBtn,
  profileBtn,
  subscribeBtn,
  closeMenu,
}: Pick<
  BuilderNavPaperProps,
  'loginBtn' | 'profileBtn' | 'subscribeBtn' | 'closeMenu'
>) => {
  const { hasUser, logout } = useUser();
  const {
    elements: { Button, Link },
  } = useWebsiteBuilder();
  return (
    <NavPaperActions>
      {!hasUser && loginBtn && (
        <Button
          LinkComponent={Link}
          href={loginBtn.href}
          variant="contained"
          color="secondary"
          onClick={closeMenu}
        >
          Login
        </Button>
      )}

      {hasUser && (
        <>
          {profileBtn && (
            <Button
              LinkComponent={Link}
              href={profileBtn.href}
              variant="contained"
              color="secondary"
              onClick={closeMenu}
            >
              Mein Konto
            </Button>
          )}

          {subscribeBtn && (
            <Button
              LinkComponent={Link}
              href={subscribeBtn.href}
              variant="contained"
              color="accent"
              onClick={closeMenu}
            >
              Meine Abos
            </Button>
          )}

          <Button
            onClick={() => {
              logout();
              closeMenu();
            }}
            variant="outlined"
            color="secondary"
          >
            Logout
          </Button>
        </>
      )}
    </NavPaperActions>
  );
};
