import { useUser } from '@wepublish/authentication/website';
import {
  navigationLinkToUrl,
  NavPaperActions,
  NavPaperChildrenWrapper,
  NavPaperMainLinks,
  NavPaperWrapper,
} from '@wepublish/navigation/website';
import { ButtonProps } from '@wepublish/ui';
import { FullNavigationFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { Children, PropsWithChildren, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdWarning } from 'react-icons/md';

import { courantTokens } from '../brand-tokens';

const { alert } = courantTokens.colors;

const alertButtonSx = {
  backgroundColor: alert[500],
  color: '#fff',
  '&:hover': { backgroundColor: alert[600] },
};

const primaryButtonSx = {
  backgroundColor: 'rgba(255, 255, 255, 1)',
  color: '#000',
  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.85)' },
};

const secondaryLinkSx = {
  fontWeight: 500,
  fontSize: courantTokens.typography.sizes.button,
  letterSpacing: 0,
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
    textDecorationColor: 'currentColor',
    textDecorationThickness: '1px',
    textDecorationSkipInk: 'auto',
    textUnderlineOffset: '0.1em',
  },
};

// Still work to do on custom modal styling
export type CourantNavPaperProps = PropsWithChildren<{
  className?: string;
  isMenuOpen: boolean;
  closeMenu: () => void;
  main: FullNavigationFragment | null | undefined;
  loginBtn?: ButtonProps | null;
  profileBtn?: ButtonProps | null;
  subscribeBtn?: ButtonProps | null;
  hasRunningSubscription: boolean;
  hasUnpaidInvoices: boolean;
  paperActions?: ReactNode;
}>;

export const CourantNavPaper = ({
  className,
  isMenuOpen,
  closeMenu,
  main,
  loginBtn,
  profileBtn,
  subscribeBtn,
  hasRunningSubscription,
  hasUnpaidInvoices,
  paperActions,
  children,
}: CourantNavPaperProps) => {
  const {
    elements: { Link, Button, H4 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { hasUser, logout } = useUser();

  if (!isMenuOpen) {
    return null;
  }

  const hasPaperChildren = Children.toArray(children).length > 0;

  const primaryButton =
    hasUser && (hasRunningSubscription || hasUnpaidInvoices) && profileBtn ?
      <Button
        LinkComponent={Link}
        variant="contained"
        color="secondary"
        onClick={closeMenu}
        sx={primaryButtonSx}
        {...profileBtn}
      >
        {t('navbar.myAccount')}
      </Button>
    : !hasRunningSubscription && !hasUnpaidInvoices && subscribeBtn ?
      <Button
        LinkComponent={Link}
        variant="contained"
        color="secondary"
        onClick={closeMenu}
        sx={primaryButtonSx}
        {...subscribeBtn}
      >
        {t('navbar.subscribe')}
      </Button>
    : null;

  const unpaidButton =
    hasUnpaidInvoices && profileBtn ?
      <Button
        LinkComponent={Link}
        variant="contained"
        onClick={closeMenu}
        startIcon={<MdWarning />}
        sx={alertButtonSx}
        {...profileBtn}
      >
        {t('navbar.unpaid')} {t('navbar.invoice')}
      </Button>
    : null;

  const secondaryLinks: ReactNode[] = [];
  if (hasUser && !hasRunningSubscription && !hasUnpaidInvoices && profileBtn) {
    secondaryLinks.push(
      <Link
        key="my-account"
        href={profileBtn.href}
        color="inherit"
        underline="none"
        onClick={closeMenu}
        sx={secondaryLinkSx}
      >
        {t('navbar.myAccount')}
      </Link>
    );
  }
  if (hasUser) {
    secondaryLinks.push(
      <Link
        key="logout"
        component="button"
        color="inherit"
        underline="none"
        onClick={() => {
          logout();
          closeMenu();
        }}
        sx={secondaryLinkSx}
      >
        {t('navbar.logout')}
      </Link>
    );
  }
  if (!hasUser && loginBtn) {
    secondaryLinks.push(
      <Link
        key="login"
        href={loginBtn.href}
        color="inherit"
        underline="none"
        onClick={closeMenu}
        sx={secondaryLinkSx}
      >
        {t('navbar.login')}
      </Link>
    );
  }

  return (
    <NavPaperWrapper
      inert={!isMenuOpen}
      className={`${className ?? ''} menu-open`.trim()}
      css={theme => ({
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(15.5),
        [theme.breakpoints.down('md')]: {
          justifyContent: 'center',
          rowGap: theme.spacing(8),
        },
        [theme.breakpoints.up('md')]: {
          gridTemplateColumns: 'auto 1fr',
        },
      })}
    >
      {hasPaperChildren && (
        <NavPaperChildrenWrapper>{children}</NavPaperChildrenWrapper>
      )}

      <NavPaperMainLinks
        css={theme => ({
          [theme.breakpoints.down('md')]: {
            justifyItems: 'center',
            textAlign: 'center',
          },
        })}
      >
        {main?.links.map((link, index) => (
          <Link
            key={index}
            href={navigationLinkToUrl(link)}
            color="inherit"
            underline="none"
            onClick={closeMenu}
            sx={theme => ({
              display: 'inline-block',
              transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
              '@media (hover: hover) and (pointer: fine)': {
                '&:hover': { transform: 'translateX(8px)' },
                [theme.breakpoints.down('md')]: {
                  '&:hover': { transform: 'translateY(-1px)' },
                },
              },
            })}
          >
            <H4
              component="span"
              css={{
                whiteSpace: 'nowrap',
                fontSize: courantTokens.typography.sizes.navMenuItem,
              }}
            >
              {link.label}
            </H4>
          </Link>
        ))}
      </NavPaperMainLinks>

      <NavPaperActions
        css={theme => ({
          marginTop: 0,
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          gap: theme.spacing(3),
          [theme.breakpoints.down('md')]: {
            alignItems: 'center',
            justifyContent: 'center',
          },
        })}
      >
        {paperActions}
        {primaryButton}
        {unpaidButton}
        {secondaryLinks}
      </NavPaperActions>
    </NavPaperWrapper>
  );
};
