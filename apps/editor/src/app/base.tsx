import styled from '@emotion/styled';
import {
  IconButton as MuiIconButton,
  List,
  ListItemIcon,
  MenuItem,
  useMediaQuery,
} from '@mui/material';
import {
  CanCreateArticle,
  CanCreateAuthor,
  CanCreateBanner,
  CanCreateBlockStyle,
  CanCreateBlockTemplate,
  CanCreateCommentRatingSystem,
  CanCreateConsent,
  CanCreateCrowdfunding,
  CanCreateDiscountCode,
  CanCreateDocument,
  CanCreateExternalApp,
  CanCreateGoodie,
  CanCreateImage,
  CanCreateMemberPlan,
  CanCreateNavigation,
  CanCreatePage,
  CanCreatePaymentMethod,
  CanCreatePaywall,
  CanCreatePeer,
  CanCreatePoll,
  CanCreateSubscription,
  CanCreateTag,
  CanCreateToken,
  CanCreateUser,
  CanCreateUserRole,
  CanDeleteArticle,
  CanDeleteAuthor,
  CanDeleteBanner,
  CanDeleteBlockStyle,
  CanDeleteBlockTemplate,
  CanDeleteCommentRatingSystem,
  CanDeleteConsent,
  CanDeleteDocument,
  CanDeleteEvent,
  CanDeleteExternalApp,
  CanDeleteImage,
  CanDeleteMemberPlan,
  CanDeleteNavigation,
  CanDeletePage,
  CanDeletePaymentMethod,
  CanDeletePeer,
  CanDeletePoll,
  CanDeleteSubscription,
  CanDeleteTag,
  CanCreateApiToken,
  CanGetApiTokens,
  CanRevokeApiToken,
  CanDeleteToken,
  CanDeleteUser,
  CanDeleteUserRole,
  CanGetAISettings,
  CanGetArticle,
  CanGetArticles,
  CanGetAudienceStats,
  CanGetAuditLogs,
  CanGetAuthor,
  CanGetAuthors,
  CanGetBanner,
  CanGetBanners,
  CanGetChallengeProviderSettings,
  CanGetCommentRatingSystem,
  CanGetComments,
  CanGetCrowdfunding,
  CanGetCrowdfundings,
  CanGetDocument,
  CanGetDocuments,
  CanGetEvent,
  CanGetImage,
  CanGetImages,
  CanGetMailLogs,
  CanGetMailProviderSettings,
  CanGetMailTemplates,
  CanGetNewsletterCampaigns,
  CanGetMemberPlan,
  CanGetMemberPlans,
  CanGetNavigation,
  CanGetNavigations,
  CanGetPage,
  CanGetPages,
  CanGetPaymentMethod,
  CanGetPaymentMethods,
  CanGetPaymentProviderSettings,
  CanGetPeer,
  CanGetPeerArticle,
  CanGetPeerArticles,
  CanGetPeers,
  CanGetPoll,
  CanGetSettings,
  CanGetSubscription,
  CanGetSubscriptionFlows,
  CanGetSubscriptions,
  CanGetSystemMails,
  CanGetTags,
  CanGetTokens,
  CanGetTrackingPixelSettings,
  CanGetUser,
  CanGetUserRole,
  CanGetUserRoles,
  CanGetUsers,
  CanGetWebsiteSettings,
  CanPreview,
  CanPublishArticle,
  CanPublishPage,
  CanSendMailTemplates,
  CanTakeActionOnComment,
  CanUpdateBlockStyle,
  CanUpdateBlockTemplate,
  CanUpdateCommentRatingSystem,
  CanUpdateComments,
  CanUpdateConsent,
  CanUpdateCrowdfunding,
  CanUpdateDiscountCode,
  CanUpdateEvent,
  CanUpdateExternalApp,
  CanUpdateGoodie,
  CanUpdateMailTemplates,
  CanUpdatePaywall,
  CanUpdateSettings,
  CanUpdateSystemMails,
  CanUpdateTag,
  CanUpdateWebsiteSettings,
} from '@wepublish/permissions';
import {
  ClickMenu,
  CommandPaletteTrigger,
  FeatureControl,
  Link,
  PermissionControl,
  SidebarNav,
  SidebarNavItem,
  SidebarNavMenu,
  Version,
} from '@wepublish/ui/editor';
import { de, enUS, fr } from 'date-fns/locale';
import {
  ElementType,
  ReactNode,
  RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAccountCircle,
  MdApproval,
  MdAutoFixHigh,
  MdAutorenew,
  MdBadge,
  MdBookOnline,
  MdBrightnessAuto,
  MdCardGiftcard,
  MdChat,
  MdContentCopy,
  MdCountertops,
  MdCreditCard,
  MdDarkMode,
  MdDashboard,
  MdDescription,
  MdEvent,
  MdExtension,
  MdFactCheck,
  MdFileCopy,
  MdGroup,
  MdGroups,
  MdHistory,
  MdHub,
  MdLightMode,
  MdLocationPin,
  MdLogout,
  MdMail,
  MdMenu,
  MdNewspaper,
  MdMoney,
  MdMultilineChart,
  MdNotificationsNone,
  MdOutgoingMail,
  MdOutlineGridView,
  MdPayment,
  MdPersonAddAlt1,
  MdPhoto,
  MdPieChartOutline,
  MdPower,
  MdQueryStats,
  MdSell,
  MdSend,
  MdSettings,
  MdSettingsInputAntenna,
  MdSignpost,
  MdStar,
  MdStyle,
  MdTranslate,
  MdTravelExplore,
  MdKey,
  MdVpnKey,
} from 'react-icons/md';
import { useLocation } from 'react-router-dom';

import { ColorModePreference, useColorMode } from './colorMode';
import { useMobileNavigation } from './mobileNavigation';
import { useSidebarMenu } from './sidebarMenu';
import { Logo } from './ui/logo';

export interface BaseProps {
  children?: ReactNode;
}

export const AVAILABLE_LANG = [
  { id: 'en', lang: 'en_US', name: 'English', locale: enUS },
  { id: 'fr', lang: 'fr_FR', name: 'Français', locale: fr },
  { id: 'de', lang: 'de_CH', name: 'Deutsch', locale: de },
];

function useStickyState(defaultValue: string, key: string) {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

const MOBILE_QUERY = '(max-width: 899px)';
const mobile = `@media ${MOBILE_QUERY}`;

const Wrapper = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: ${({ theme }) => theme.vars.palette.background.default};

  ${mobile} {
    flex-direction: column;
    height: 100dvh;
  }
`;

const SkipLink = styled.a`
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 1100;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
  color: ${({ theme }) => theme.vars.palette.text.primary};
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--wep-elevated-shadow);
  transform: translateY(calc(-100% - 16px));

  &:focus {
    transform: none;
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 2px;
  }
`;

const Layout = styled('div')`
  display: flex;
  flex-direction: row;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
`;

const Sidebar = styled('div')`
  display: flex;
  flex-direction: column;
  width: 248px;
  flex: 0 0 248px;
  min-height: 0;

  ${mobile} {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1040;
    width: min(300px, 86vw) !important;
    background-color: ${({ theme }) => theme.vars.palette.background.default};
    transform: translateX(-100%);
    transition: transform 0.2s ease-out;

    &[data-open='true'] {
      transform: none;
      box-shadow: var(--wep-elevated-shadow);
    }
  }
`;

const Backdrop = styled.div`
  display: none;

  ${mobile} {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1039;
    background-color: rgba(0, 0, 0, 0.3);
  }
`;

const MobileTopBar = styled.header`
  display: none;

  ${mobile} {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 8px;
    height: 56px;
    padding: 0 8px;
    border-bottom: 1px solid var(--wep-shell-border);
  }
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  padding: 22px 22px 18px;
  color: ${({ theme }) => theme.vars.palette.text.primary};

  svg {
    width: 128px;
    height: auto;
  }

  svg :is(path, use)[fill='black'] {
    fill: currentColor;
  }

  svg :is(path, use)[fill='white'] {
    fill: ${({ theme }) => theme.vars.palette.background.default};
  }
`;

const Search = styled(CommandPaletteTrigger)`
  margin: 0 12px 10px;
  width: calc(100% - 24px);
`;

const Sidenav = styled(List)<{ component?: ElementType }>`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0 12px 12px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.2s;

  &:hover {
    scrollbar-color: rgb(
        from ${({ theme }) => theme.vars.palette.text.primary} r g b / 22%
      )
      transparent;
  }

  .MuiListItemButton-root {
    border-radius: 8px;
    font-weight: 500;
    color: var(--wep-nav-text);
    overflow-wrap: anywhere;

    > svg {
      flex-shrink: 0;
    }
  }

  .MuiListItemIcon-root {
    color: inherit;
  }

  .MuiListItemButton-root:hover {
    background-color: var(--wep-nav-hover-bg);
    color: var(--wep-nav-hover-text);
  }

  .MuiListItemButton-root.Mui-selected {
    background-color: var(--wep-nav-active-bg);
    color: var(--wep-nav-active-text);
    font-weight: 600;
  }

  .MuiListItemButton-root[data-contains-current='true'] {
    font-weight: 600;
  }
`;

const Footer = styled('div')`
  padding: 8px 12px;
  gap: 4px;
  border-top: 1px solid var(--wep-shell-border);
`;

const IconButton = styled(MuiIconButton)`
  && {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    color: var(--wep-nav-text);
  }

  &&:hover {
    background-color: var(--wep-nav-hover-bg);
    color: ${({ theme }) => theme.vars.palette.text.primary};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const MobileBrand = styled(Brand)`
  padding: 0 8px;

  svg {
    width: 104px;
  }
`;

const ChildrenContainer = styled('main')`
  --wep-page-padding-y: 32px;
  --wep-page-padding-x: 32px;

  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  margin: 8px 8px 8px 0;
  padding: var(--wep-page-padding-y) var(--wep-page-padding-x);
  overflow-y: auto;
  max-width: 100%;
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
  border: 1px solid var(--wep-shell-border);
  border-radius: 14px;
  box-shadow: var(--wep-surface-shadow);

  &:focus {
    outline: none;
  }

  ${mobile} {
    --wep-page-padding-y: 20px;
    --wep-page-padding-x: 16px;
    margin: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
`;

const colorModeIcons = {
  light: <MdLightMode />,
  dark: <MdDarkMode />,
  system: <MdBrightnessAuto />,
};

const colorModePreferences: ColorModePreference[] = ['system', 'light', 'dark'];

function useFocusMainWhenFocusIsLost(
  mainRef: RefObject<HTMLElement | null>,
  pathname: string
) {
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    if (lastPathRef.current === pathname) {
      return;
    }

    lastPathRef.current = pathname;

    window.setTimeout(() => {
      const active = document.activeElement;

      if (!active || active === document.body || !active.isConnected) {
        mainRef.current?.focus();
      }
    });
  }, [mainRef, pathname]);
}

export function Base({ children }: BaseProps) {
  const { t, i18n } = useTranslation();
  const { preference: colorModePreference, setPreference: setColorMode } =
    useColorMode();
  const {
    open: mobileNavigationOpen,
    toggle: toggleMobileNavigation,
    close: closeMobileNavigation,
    triggerRef: mobileNavigationTriggerRef,
    panelRef: mobileNavigationPanelRef,
  } = useMobileNavigation();
  const { openMenus, followsRoute, toggleMenu } = useSidebarMenu();
  const { pathname } = useLocation();
  const isMobile = useMediaQuery(MOBILE_QUERY, { noSsr: true });
  const sidebarIsModal = isMobile && mobileNavigationOpen;
  const sidebarIsHidden = isMobile && !mobileNavigationOpen;
  const sidebarId = useId();
  const mainRef = useRef<HTMLElement>(null);

  useFocusMainWhenFocusIsLost(mainRef, pathname);

  const [uiLanguage, setUILanguage] = useStickyState(
    AVAILABLE_LANG[0].id,
    'wepublish/language'
  );

  useEffect(() => {
    i18n.changeLanguage(uiLanguage);
  }, [i18n, uiLanguage]);

  return (
    <Wrapper>
      <SkipLink
        href="#main-content"
        inert={sidebarIsModal}
        onClick={event => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        {t('navbar.skipToContent')}
      </SkipLink>

      <MobileTopBar inert={sidebarIsModal}>
        <IconButton
          ref={mobileNavigationTriggerRef}
          onClick={toggleMobileNavigation}
          aria-label={t('navbar.menu')}
          aria-expanded={mobileNavigationOpen}
          aria-controls={sidebarId}
        >
          <MdMenu />
        </IconButton>
        <MobileBrand
          to="/dashboard"
          aria-label="We.Publish"
        >
          <Logo />
        </MobileBrand>
      </MobileTopBar>

      {mobileNavigationOpen && <Backdrop onClick={closeMobileNavigation} />}

      <Layout>
        <Sidebar
          ref={mobileNavigationPanelRef}
          id={sidebarId}
          data-open={mobileNavigationOpen}
          inert={sidebarIsHidden}
          role={sidebarIsModal ? 'dialog' : undefined}
          aria-modal={sidebarIsModal ? 'true' : undefined}
          aria-label={sidebarIsModal ? t('navbar.menu') : undefined}
        >
          <Brand
            to="/dashboard"
            aria-label="We.Publish"
          >
            <Logo />
          </Brand>

          <Search />

          <Sidenav
            component="nav"
            aria-label={t('navbar.mainNavigation')}
          >
            <SidebarNav>
              <SidebarNavMenu
                title={t('navbar.dashboard')}
                icon={<MdPieChartOutline />}
                open={openMenus.includes('dashboard')}
                openIfCurrent={followsRoute}
                onToggle={wasOpen => toggleMenu('dashboard', wasOpen)}
              >
                <SidebarNavItem
                  href="/dashboard"
                  icon={<MdPieChartOutline />}
                >
                  {t('navbar.dashboard')}
                </SidebarNavItem>

                <SidebarNavItem
                  href="/notifications"
                  icon={<MdNotificationsNone />}
                >
                  {t('navbar.notifications')}
                </SidebarNavItem>

                <PermissionControl
                  qualifyingPermissions={[
                    CanCreateExternalApp.id,
                    CanUpdateExternalApp.id,
                    CanDeleteExternalApp.id,
                  ]}
                >
                  <SidebarNavItem
                    href="/dashboard/apps"
                    icon={<MdExtension />}
                  >
                    {t('navbar.apps')}
                  </SidebarNavItem>
                </PermissionControl>
              </SidebarNavMenu>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetArticles.id,
                  CanGetArticle.id,
                  CanCreateArticle.id,
                  CanDeleteArticle.id,
                  CanPublishArticle.id,
                  CanPreview.id,
                  CanGetPeerArticles.id,
                  CanGetPeerArticle.id,
                  CanGetTags.id,
                  CanCreatePaywall.id,
                  CanUpdatePaywall.id,
                ]}
              >
                <SidebarNavMenu
                  title={t('navbar.articles')}
                  icon={<MdDescription />}
                  open={openMenus.includes('articles')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('articles', wasOpen)}
                >
                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetArticles.id,
                      CanGetArticle.id,
                      CanCreateArticle.id,
                      CanDeleteArticle.id,
                      CanPublishArticle.id,
                      CanPreview.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/articles"
                      icon={<MdDescription />}
                    >
                      {t('navbar.articles')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetPeerArticles.id,
                      CanGetPeerArticle.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/articles/peer"
                      icon={<MdFileCopy />}
                    >
                      {t('navbar.peerArticles')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <SidebarNavItem
                    href="/network"
                    icon={<MdHub />}
                  >
                    {t('navbar.networkContent')}
                  </SidebarNavItem>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetTags.id,
                      CanCreateTag.id,
                      CanUpdateTag.id,
                      CanDeleteTag.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/articles/tags"
                      icon={<MdSell />}
                    >
                      {t('navbar.articleTags')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanCreatePaywall.id,
                      CanUpdatePaywall.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/articles/paywalls"
                      icon={<MdPayment />}
                    >
                      {t('paywall.navbar')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetPages.id,
                  CanGetPage.id,
                  CanCreatePage.id,
                  CanDeletePage.id,
                  CanPublishPage.id,
                  CanPreview.id,
                  CanGetTags.id,
                ]}
              >
                <SidebarNavMenu
                  title={t('navbar.pages')}
                  icon={<MdDashboard />}
                  open={openMenus.includes('pages')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('pages', wasOpen)}
                >
                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetPages.id,
                      CanGetPage.id,
                      CanCreatePage.id,
                      CanDeletePage.id,
                      CanPublishPage.id,
                      CanPreview.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/pages"
                      icon={<MdDashboard />}
                    >
                      {t('navbar.pages')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetTags.id,
                      CanCreateTag.id,
                      CanUpdateTag.id,
                      CanDeleteTag.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/pages/tags"
                      icon={<MdSell />}
                    >
                      {t('navbar.pageTags')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetPoll.id,
                  CanCreatePoll.id,
                  CanDeletePoll.id,
                  CanCreateBlockStyle.id,
                  CanUpdateBlockStyle.id,
                  CanDeleteBlockStyle.id,
                ]}
              >
                <SidebarNavMenu
                  title={t('navbar.blocks.topMenu')}
                  icon={<MdOutlineGridView />}
                  open={openMenus.includes('block-content')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('block-content', wasOpen)}
                >
                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetPoll.id,
                      CanCreatePoll.id,
                      CanDeletePoll.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/polls"
                      icon={<MdQueryStats />}
                    >
                      {t('navbar.blocks.polls')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetCrowdfundings.id,
                      CanGetCrowdfunding.id,
                      CanCreateCrowdfunding.id,
                      CanUpdateCrowdfunding.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/crowdfundings"
                      icon={<MdMoney />}
                    >
                      {t('navbar.blocks.crowdfundings')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanCreateBlockStyle.id,
                      CanUpdateBlockStyle.id,
                      CanDeleteBlockStyle.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/block-content/styles"
                      icon={<MdStyle />}
                    >
                      {t('navbar.blocks.blockStyles')}
                    </SidebarNavItem>
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={[
                      CanCreateBlockTemplate.id,
                      CanUpdateBlockTemplate.id,
                      CanDeleteBlockTemplate.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/block-content/templates"
                      icon={<MdContentCopy />}
                    >
                      {t('navbar.blocks.blockTemplates')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetComments.id,
                  CanGetTags.id,
                  CanGetCommentRatingSystem.id,
                ]}
              >
                <SidebarNavMenu
                  title={t('navbar.comments')}
                  icon={<MdChat />}
                  open={openMenus.includes('comments')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('comments', wasOpen)}
                >
                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetComments.id,
                      CanUpdateComments.id,
                      CanTakeActionOnComment.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/comments"
                      icon={<MdChat />}
                    >
                      {t('navbar.comments')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetTags.id,
                      CanCreateTag.id,
                      CanUpdateTag.id,
                      CanDeleteTag.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/comments/tags"
                      icon={<MdSell />}
                    >
                      {t('navbar.commentTags')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetCommentRatingSystem.id,
                      CanCreateCommentRatingSystem.id,
                      CanUpdateCommentRatingSystem.id,
                      CanDeleteCommentRatingSystem.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/comments/rating"
                      icon={<MdStar />}
                    >
                      {t('navbar.commentRating')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetEvent.id,
                  CanGetCommentRatingSystem.id,
                ]}
              >
                <SidebarNavMenu
                  title={t('navbar.events')}
                  icon={<MdEvent />}
                  open={openMenus.includes('events')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('events', wasOpen)}
                >
                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetEvent.id,
                      CanUpdateEvent.id,
                      CanDeleteEvent.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/events"
                      icon={<MdEvent />}
                    >
                      {t('navbar.events')}
                    </SidebarNavItem>
                  </PermissionControl>

                  {/* <PermissionControl
                      qualifyingPermissions={[
                        CanGetEvent.id,
                        CanUpdateEvent.id,
                        CanDeleteEvent.id,
                      ]}
                    >
                      <SidebarNavItem
        href="/events/import"
                        icon={<MdEventAvailable />}
                      >
                        {t('navbar.importableEvents')}
                      </SidebarNavItem>
                    </PermissionControl> */}

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetTags.id,
                      CanCreateTag.id,
                      CanUpdateTag.id,
                      CanDeleteTag.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/events/tags"
                      icon={<MdSell />}
                    >
                      {t('navbar.eventTags')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetImages.id,
                  CanGetImage.id,
                  CanCreateImage.id,
                  CanDeleteImage.id,
                  CanGetDocuments.id,
                  CanGetDocument.id,
                  CanCreateDocument.id,
                  CanDeleteDocument.id,
                ]}
              >
                <SidebarNavMenu
                  title={t('navbar.media')}
                  icon={<MdPhoto />}
                  open={openMenus.includes('media')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('media', wasOpen)}
                >
                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetImages.id,
                      CanGetImage.id,
                      CanCreateImage.id,
                      CanDeleteImage.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/images"
                      icon={<MdPhoto />}
                    >
                      {t('navbar.imageLibrary')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetDocuments.id,
                      CanGetDocument.id,
                      CanCreateDocument.id,
                      CanDeleteDocument.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/documents"
                      icon={<MdDescription />}
                    >
                      {t('navbar.documentLibrary')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetNavigations.id,
                  CanGetNavigation.id,
                  CanCreateNavigation.id,
                  CanDeleteNavigation.id,
                ]}
              >
                <SidebarNavItem
                  href="/navigations"
                  icon={<MdLocationPin />}
                >
                  {t('navbar.navigations')}
                </SidebarNavItem>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetBanners.id,
                  CanGetBanner.id,
                  CanCreateBanner.id,
                  CanDeleteBanner.id,
                ]}
              >
                <SidebarNavItem
                  href="/banners"
                  icon={<MdSignpost />}
                >
                  {t('navbar.banners')}
                </SidebarNavItem>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[CanGetAuthors.id, CanGetTags.id]}
              >
                <SidebarNavMenu
                  title={t('navbar.authors')}
                  icon={<MdGroup />}
                  open={openMenus.includes('authors')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('authors', wasOpen)}
                >
                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetAuthors.id,
                      CanGetAuthor.id,
                      CanCreateAuthor.id,
                      CanDeleteAuthor.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/authors"
                      icon={<MdGroup />}
                    >
                      {t('navbar.authors')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetTags.id,
                      CanCreateTag.id,
                      CanUpdateTag.id,
                      CanDeleteTag.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/authors/tags"
                      icon={<MdSell />}
                    >
                      {t('navbar.authorTags')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetUsers.id,
                  CanGetUser.id,
                  CanCreateUser.id,
                  CanDeleteUser.id,
                  CanCreateUserRole.id,
                  CanGetUserRole.id,
                  CanGetUserRoles.id,
                  CanDeleteUserRole.id,
                  CanCreateSubscription.id,
                  CanGetSubscriptions.id,
                  CanGetSubscription.id,
                  CanDeleteSubscription.id,
                  CanGetAudienceStats.id,
                ]}
              >
                <SidebarNavMenu
                  title={t('navbar.audience')}
                  icon={<MdGroups />}
                  open={openMenus.includes('audience')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('audience', wasOpen)}
                >
                  <PermissionControl
                    qualifyingPermissions={[CanGetAudienceStats.id]}
                  >
                    <SidebarNavItem
                      href="/audience/dashboard"
                      icon={<MdMultilineChart />}
                    >
                      {t('navbar.audienceDashboard')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <SidebarNavItem
                    href="/users"
                    icon={<MdAccountCircle />}
                  >
                    {t('navbar.users')}
                  </SidebarNavItem>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetSubscriptions.id,
                      CanGetSubscription.id,
                      CanCreateSubscription.id,
                      CanDeleteSubscription.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/subscriptions"
                      icon={<MdAutorenew />}
                    >
                      {t('navbar.subscriptions')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanCreateConsent.id,
                      CanUpdateConsent.id,
                      CanDeleteConsent.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/consents"
                      icon={<MdApproval />}
                    >
                      {t('navbar.consents')}
                    </SidebarNavItem>
                    <SidebarNavItem
                      href="/userConsents"
                      icon={<MdFactCheck />}
                    >
                      {t('navbar.userConsents')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetMailTemplates.id,
                  CanUpdateMailTemplates.id,
                  CanGetSystemMails.id,
                  CanUpdateSystemMails.id,
                  CanSendMailTemplates.id,
                  CanGetMailLogs.id,
                  CanGetSubscriptionFlows.id,
                  CanGetNewsletterCampaigns.id,
                ]}
              >
                <SidebarNavMenu
                  title={t('navbar.communication')}
                  icon={<MdMail />}
                  open={openMenus.includes('communication')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('communication', wasOpen)}
                >
                  <PermissionControl
                    qualifyingPermissions={[CanSendMailTemplates.id]}
                  >
                    <SidebarNavItem
                      href="/mailsend"
                      icon={<MdSend />}
                    >
                      {t('navbar.mailSend')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetSubscriptionFlows.id,
                      CanGetSystemMails.id,
                      CanUpdateSystemMails.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/communicationflows/edit/default"
                      icon={<MdOutgoingMail />}
                    >
                      {t('navbar.subscriptionSettings')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetMailTemplates.id,
                      CanUpdateMailTemplates.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/mailtemplates"
                      icon={<MdMail />}
                    >
                      {t('navbar.mailTemplates')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <FeatureControl feature="newsletter-editor">
                    <PermissionControl
                      qualifyingPermissions={[CanGetNewsletterCampaigns.id]}
                    >
                      <SidebarNavItem
                        href="/newsletter"
                        icon={<MdNewspaper />}
                      >
                        {t('newsletter.navbar')}
                      </SidebarNavItem>
                    </PermissionControl>
                  </FeatureControl>

                  <PermissionControl
                    qualifyingPermissions={[CanGetMailLogs.id]}
                  >
                    <SidebarNavItem
                      href="/maillog"
                      icon={<MdOutgoingMail />}
                    >
                      {t('navbar.mailLog')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetMemberPlans.id,
                  CanGetMemberPlan.id,
                  CanCreateMemberPlan.id,
                  CanDeleteMemberPlan.id,
                  CanGetPaymentMethods.id,
                  CanGetPaymentMethod.id,
                  CanCreatePaymentMethod.id,
                  CanDeletePaymentMethod.id,
                  CanGetSubscriptionFlows.id,
                  CanCreateDiscountCode.id,
                  CanUpdateDiscountCode.id,
                  CanCreateGoodie.id,
                  CanUpdateGoodie.id,
                ]}
              >
                <SidebarNavMenu
                  title={t('navbar.subscriptionPlans')}
                  icon={<MdBadge />}
                  open={openMenus.includes('usersAndSubscriptions')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen =>
                    toggleMenu('usersAndSubscriptions', wasOpen)
                  }
                >
                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetMemberPlans.id,
                      CanGetMemberPlan.id,
                      CanCreateMemberPlan.id,
                      CanDeleteMemberPlan.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/memberplans"
                      icon={<MdBookOnline />}
                    >
                      {t('navbar.memberPlans')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetPaymentMethods.id,
                      CanGetPaymentMethod.id,
                      CanCreatePaymentMethod.id,
                      CanDeletePaymentMethod.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/paymentmethods"
                      icon={<MdCreditCard />}
                    >
                      {t('navbar.paymentMethods')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanCreateDiscountCode.id,
                      CanUpdateDiscountCode.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/discountCodes"
                      icon={<MdCountertops />}
                    >
                      {t('discountCode.navbar')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanCreateGoodie.id,
                      CanUpdateGoodie.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/goodies"
                      icon={<MdCardGiftcard />}
                    >
                      {t('goodie.navbar')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetPeers.id,
                  CanGetPeer.id,
                  CanCreatePeer.id,
                  CanDeletePeer.id,
                ]}
              >
                <SidebarNavMenu
                  title={t('navbar.peering')}
                  icon={<MdSettingsInputAntenna />}
                  open={openMenus.includes('peering')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('peering', wasOpen)}
                >
                  <SidebarNavItem
                    href="/peering"
                    icon={<MdPersonAddAlt1 />}
                  >
                    {t('navbar.peers')}
                  </SidebarNavItem>
                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetTokens.id,
                      CanCreateToken.id,
                      CanDeleteToken.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/tokens"
                      icon={<MdVpnKey />}
                    >
                      {t('navbar.tokens')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>

              <PermissionControl
                qualifyingPermissions={[
                  CanGetSettings.id,
                  CanUpdateSettings.id,
                  CanGetMailTemplates.id,
                  CanUpdateMailTemplates.id,
                  CanGetUserRoles.id,
                  CanGetUserRole.id,
                  CanCreateUserRole.id,
                  CanDeleteUserRole.id,
                  CanGetAuditLogs.id,
                ]}
              >
                <SidebarNavMenu
                  icon={<MdSettings />}
                  title={t('navbar.settings')}
                  open={openMenus.includes('settings')}
                  openIfCurrent={followsRoute}
                  onToggle={wasOpen => toggleMenu('settings', wasOpen)}
                >
                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetApiTokens.id,
                      CanCreateApiToken.id,
                      CanRevokeApiToken.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/api-tokens"
                      icon={<MdKey />}
                    >
                      {t('navbar.apiTokens')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[CanGetAuditLogs.id]}
                  >
                    <SidebarNavItem
                      href="/audit-log"
                      icon={<MdHistory />}
                    >
                      {t('navbar.auditLog')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetSettings.id,
                      CanUpdateSettings.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/settings"
                      icon={<MdSettings />}
                    >
                      {t('navbar.settings')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetUserRoles.id,
                      CanGetUserRole.id,
                      CanCreateUserRole.id,
                      CanDeleteUserRole.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/userroles"
                      icon={<MdBadge />}
                    >
                      {t('navbar.userRoles')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetAISettings.id,
                      CanGetChallengeProviderSettings.id,
                      CanGetPaymentProviderSettings.id,
                      CanGetTrackingPixelSettings.id,
                      CanGetMailProviderSettings.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/integrations"
                      icon={<MdPower />}
                    >
                      {t('navbar.integrations')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanGetWebsiteSettings.id,
                      CanUpdateWebsiteSettings.id,
                    ]}
                  >
                    <SidebarNavItem
                      href="/settings/website"
                      icon={<MdAutoFixHigh />}
                    >
                      {t('websiteSettings.navbar')}
                    </SidebarNavItem>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[CanGetSettings.id]}
                  >
                    <SidebarNavItem
                      href="/settings/seo"
                      icon={<MdTravelExplore />}
                    >
                      {t('seoChecklist.navbar')}
                    </SidebarNavItem>
                  </PermissionControl>
                </SidebarNavMenu>
              </PermissionControl>
            </SidebarNav>
          </Sidenav>

          <Footer>
            <ClickMenu
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              trigger={
                <IconButton
                  title={t('navbar.logout')}
                  aria-label={t('navbar.logout')}
                >
                  <MdLogout />
                </IconButton>
              }
            >
              {close => (
                <MenuItem
                  component={Link}
                  to="/logout"
                  onClick={close}
                >
                  {t('navbar.logout')}
                </MenuItem>
              )}
            </ClickMenu>

            <ClickMenu
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              trigger={
                <IconButton
                  title={t('navbar.language')}
                  aria-label={t('navbar.language')}
                >
                  <MdTranslate />
                </IconButton>
              }
            >
              {close =>
                AVAILABLE_LANG.map(lang => (
                  <MenuItem
                    key={lang.id}
                    lang={lang.id}
                    role="menuitemradio"
                    aria-checked={lang.id === i18n.language}
                    selected={lang.id === i18n.language}
                    onClick={() => {
                      setUILanguage(lang.id);
                      close();
                    }}
                  >
                    {lang.name}
                  </MenuItem>
                ))
              }
            </ClickMenu>

            <ClickMenu
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              trigger={
                <IconButton
                  title={t('navbar.colorMode.title')}
                  aria-label={t('navbar.colorMode.title')}
                >
                  {colorModeIcons[colorModePreference]}
                </IconButton>
              }
            >
              {close =>
                colorModePreferences.map(preference => (
                  <MenuItem
                    key={preference}
                    role="menuitemradio"
                    aria-checked={preference === colorModePreference}
                    selected={preference === colorModePreference}
                    onClick={() => {
                      setColorMode(preference);
                      close();
                    }}
                  >
                    <ListItemIcon>{colorModeIcons[preference]}</ListItemIcon>
                    {t(`navbar.colorMode.${preference}`)}
                  </MenuItem>
                ))
              }
            </ClickMenu>
          </Footer>

          <Version />
        </Sidebar>
        <ChildrenContainer
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          inert={sidebarIsModal}
        >
          {children}
        </ChildrenContainer>
      </Layout>
    </Wrapper>
  );
}
