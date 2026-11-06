import { useUser } from '@wepublish/authentication/website';
import {
  navigationLinkToUrl,
  NavPaperActions,
  NavPaperCategory,
  NavPaperCategoryLinks,
  NavPaperChildrenWrapper,
  NavPaperLinksGroup,
  NavPaperMainLinks,
  NavPaperName,
  NavPaperSeparator,
  NavPaperWrapper,
} from '@wepublish/navigation/website';
import { ButtonProps } from '@wepublish/ui';
import { FullNavigationFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { PropsWithChildren, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// Still work to do on custom modal styling
export type CourantNavPaperProps = PropsWithChildren<{
  className?: string;
  isMenuOpen: boolean;
  closeMenu: () => void;
  main: FullNavigationFragment | null | undefined;
  categories: FullNavigationFragment[][];
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
  categories,
  loginBtn,
  profileBtn,
  subscribeBtn,
  hasRunningSubscription,
  hasUnpaidInvoices,
  paperActions,
  children,
}: CourantNavPaperProps) => {
  const {
    elements: { Link, Button, H4, H6 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { hasUser, logout } = useUser();

  if (!isMenuOpen) {
    return null;
  }

  return (
    <NavPaperWrapper
      inert={!isMenuOpen}
      className={`${className ?? ''} menu-open`.trim()}
    >
      {children && (
        <NavPaperChildrenWrapper>{children}</NavPaperChildrenWrapper>
      )}

      <NavPaperMainLinks>
        {main?.links.map((link, index) => (
          <Link
            key={index}
            href={navigationLinkToUrl(link)}
            color="inherit"
            underline="none"
            onClick={closeMenu}
          >
            <H4
              component="span"
              css={{ fontWeight: 700 }}
            >
              {link.label}
            </H4>
          </Link>
        ))}

        <NavPaperActions>
          {paperActions}

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
              {t('navbar.myAccount')}
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
              {t('navbar.logout')}
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
              {t('navbar.login')}
            </Button>
          )}
        </NavPaperActions>
      </NavPaperMainLinks>

      {!!categories.length &&
        categories.map((group, groupIndex) => (
          <NavPaperLinksGroup key={groupIndex}>
            {groupIndex > 0 && <NavPaperSeparator />}

            {group.map(nav => (
              <NavPaperCategory key={nav.id}>
                <NavPaperName>{nav.name}</NavPaperName>

                <NavPaperCategoryLinks>
                  {nav.links?.map((link, index) => (
                    <Link
                      key={index}
                      href={navigationLinkToUrl(link)}
                      color="inherit"
                      underline="none"
                      onClick={closeMenu}
                    >
                      <H6
                        component="span"
                        css={{ fontWeight: 700 }}
                      >
                        {link.label}
                      </H6>
                    </Link>
                  ))}
                </NavPaperCategoryLinks>
              </NavPaperCategory>
            ))}
          </NavPaperLinksGroup>
        ))}
    </NavPaperWrapper>
  );
};
