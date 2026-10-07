import styled from '@emotion/styled';
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
  CanDeleteToken,
  CanDeleteUser,
  CanDeleteUserRole,
  CanGetAISettings,
  CanGetArticle,
  CanGetArticles,
  CanGetAudienceStats,
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
  CanGetAuditLogs,
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
import { PermissionControl, Version } from '@wepublish/ui/editor';
import { de, enUS, fr } from 'date-fns/locale';
import { forwardRef, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAccountCircle,
  MdApproval,
  MdAutoFixHigh,
  MdAutorenew,
  MdBadge,
  MdBookOnline,
  MdCardGiftcard,
  MdChat,
  MdBrightnessAuto,
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
  MdHub,
  MdLightMode,
  MdLocationPin,
  MdLogout,
  MdMail,
  MdMenu,
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
  MdHistory,
  MdSettings,
  MdSettingsInputAntenna,
  MdSignpost,
  MdStar,
  MdStyle,
  MdTranslate,
  MdVpnKey,
} from 'react-icons/md';
import { Link, useLocation } from 'react-router-dom';
import {
  Container,
  IconButton as RIconButton,
  Nav,
  Navbar,
  Sidebar as RSidebar,
  Sidenav as RSidenav,
} from 'rsuite';

import { ColorModePreference, useColorMode } from './colorMode';
import { useMobileNavigation } from './mobileNavigation';
import { onlyLatestOpen } from './sidebarMenu';
import { Logo } from './ui/logo';

export interface BaseProps {
  children?: ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, any>(
  ({ href, children, ...rest }, ref) => (
    <Link
      ref={ref}
      to={href}
      {...rest}
    >
      {children}
    </Link>
  )
);

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

const mobile = '@media (max-width: 899px)';

const Wrapper = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--wep-shell-bg);

  ${mobile} {
    flex-direction: column;
    height: 100dvh;
  }
`;

const Layout = styled(Container)`
  min-width: 0;
  min-height: 0;
`;

const Sidebar = styled(RSidebar)`
  display: flex;
  flex-direction: column;

  ${mobile} {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1040;
    width: min(300px, 86vw) !important;
    background-color: var(--wep-shell-bg);
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
    background-color: var(--rs-bg-backdrop);
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
  color: var(--rs-text-heading);

  svg {
    width: 128px;
    height: auto;
  }

  svg path[fill='black'] {
    fill: currentColor;
  }

  svg path[fill='white'] {
    fill: var(--wep-shell-bg);
  }
`;

const Sidenav = styled(RSidenav)`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0 12px 12px;

  &,
  .rs-sidenav-body {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    transition: scrollbar-color 0.2s;
  }

  &:hover,
  &:hover .rs-sidenav-body {
    scrollbar-color: rgb(from var(--rs-text-primary) r g b / 22%) transparent;
  }

  .rs-sidenav-item,
  .rs-sidenav-dropdown-toggle,
  .rs-dropdown-item {
    border-radius: 8px;
    font-weight: 500;
    overflow-wrap: anywhere;

    > svg {
      flex-shrink: 0;
    }
  }

  && .rs-dropdown-menu {
    margin-right: 0;
    padding-right: 0;
  }

  .rs-sidenav-item[data-active='true'],
  .rs-dropdown-item[data-active='true'] {
    background-color: var(--wep-nav-active-bg);
    color: var(--wep-nav-active-text);
    font-weight: 600;
  }
`;

const Footer = styled(Navbar)`
  padding: 8px 12px;
  gap: 4px;
  border-top: 1px solid var(--wep-shell-border);
`;

const IconButton = styled(RIconButton)`
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
    color: var(--rs-text-heading);
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

const ChildrenContainer = styled(Container)`
  --wep-page-padding-top: 32px;
  --wep-page-padding-x: 32px;
  margin: 8px 8px 8px 0;
  padding: var(--wep-page-padding-top) var(--wep-page-padding-x) 40px;
  overflow-y: auto;
  max-width: 100%;
  background-color: var(--wep-content-bg);
  border: 1px solid var(--wep-shell-border);
  border-radius: 14px;
  box-shadow: var(--wep-surface-shadow);

  ${mobile} {
    --wep-page-padding-top: 20px;
    --wep-page-padding-x: 16px;
    margin: 0;
    padding: var(--wep-page-padding-top) var(--wep-page-padding-x) 32px;
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

export function Base({ children }: BaseProps) {
  const { pathname } = useLocation();
  const path = pathname.substring(1);

  const { t, i18n } = useTranslation();
  const { preference: colorModePreference, setPreference: setColorMode } =
    useColorMode();
  const mobileNavigation = useMobileNavigation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const [uiLanguage, setUILanguage] = useStickyState(
    AVAILABLE_LANG[0].id,
    'wepublish/language'
  );

  useEffect(() => {
    i18n.changeLanguage(uiLanguage);
  }, [i18n, uiLanguage]);

  return (
    <Wrapper>
      <MobileTopBar>
        <IconButton
          appearance="subtle"
          icon={<MdMenu />}
          onClick={mobileNavigation.toggle}
          aria-label={t('navbar.menu')}
          aria-expanded={mobileNavigation.open}
        />
        <MobileBrand
          to="/dashboard"
          aria-label="We.Publish"
        >
          <Logo />
        </MobileBrand>
      </MobileTopBar>

      {mobileNavigation.open && <Backdrop onClick={mobileNavigation.close} />}

      <Layout>
        <Sidebar
          width={248}
          data-open={mobileNavigation.open}
        >
          <Brand
            to="/dashboard"
            aria-label="We.Publish"
          >
            <Logo />
          </Brand>

          <Sidenav
            openKeys={openMenus}
            onOpenChange={keys =>
              setOpenMenus(current => onlyLatestOpen(current, keys.map(String)))
            }
            appearance="default"
          >
            <RSidenav.Body>
              <Nav>
                <Nav.Menu
                  eventKey={'dashboard'}
                  title={t('navbar.dashboard')}
                  icon={<MdPieChartOutline />}
                >
                  <Nav.Item
                    as={NavLink}
                    href="/dashboard"
                    icon={<MdPieChartOutline />}
                    active={path === 'dashboard' || path === ''}
                  >
                    {t('navbar.dashboard')}
                  </Nav.Item>

                  <Nav.Item
                    as={NavLink}
                    href="/notifications"
                    icon={<MdNotificationsNone />}
                    active={path === 'notifications'}
                  >
                    {t('navbar.notifications')}
                  </Nav.Item>

                  <PermissionControl
                    qualifyingPermissions={[
                      CanCreateExternalApp.id,
                      CanUpdateExternalApp.id,
                      CanDeleteExternalApp.id,
                    ]}
                  >
                    <Nav.Item
                      as={NavLink}
                      href="/dashboard/apps"
                      icon={<MdExtension />}
                      active={path === 'dashboard/apps'}
                    >
                      {t('navbar.apps')}
                    </Nav.Item>
                  </PermissionControl>
                </Nav.Menu>

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
                  <Nav.Menu
                    eventKey={'articles'}
                    title={t('navbar.articles')}
                    icon={<MdDescription />}
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
                      <Nav.Item
                        as={NavLink}
                        href="/articles"
                        icon={<MdDescription />}
                        active={path === 'articles'}
                      >
                        {t('navbar.articles')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetPeerArticles.id,
                        CanGetPeerArticle.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/articles/peer"
                        icon={<MdFileCopy />}
                        active={path === 'articles/peer'}
                      >
                        {t('navbar.peerArticles')}
                      </Nav.Item>
                    </PermissionControl>

                    <Nav.Item
                      as={NavLink}
                      href="/network"
                      icon={<MdHub />}
                      active={path === 'network'}
                    >
                      {t('navbar.networkContent')}
                    </Nav.Item>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetTags.id,
                        CanCreateTag.id,
                        CanUpdateTag.id,
                        CanDeleteTag.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/articles/tags"
                        icon={<MdSell />}
                        active={path === 'articles/tags'}
                      >
                        {t('navbar.articleTags')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanCreatePaywall.id,
                        CanUpdatePaywall.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/articles/paywalls"
                        icon={<MdPayment />}
                        active={path === 'articles/paywalls'}
                      >
                        {t('paywall.navbar')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
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
                  <Nav.Menu
                    eventKey={'pages'}
                    title={t('navbar.pages')}
                    icon={<MdDashboard />}
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
                      <Nav.Item
                        as={NavLink}
                        href="/pages"
                        icon={<MdDashboard />}
                        active={path === 'pages'}
                      >
                        {t('navbar.pages')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetTags.id,
                        CanCreateTag.id,
                        CanUpdateTag.id,
                        CanDeleteTag.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/pages/tags"
                        icon={<MdSell />}
                        active={path === 'pages/tags'}
                      >
                        {t('navbar.pageTags')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
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
                  <Nav.Menu
                    eventKey={'block-content'}
                    title={t('navbar.blocks.topMenu')}
                    icon={<MdOutlineGridView />}
                  >
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetPoll.id,
                        CanCreatePoll.id,
                        CanDeletePoll.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/polls"
                        active={path === 'polls'}
                        icon={<MdQueryStats />}
                      >
                        {t('navbar.blocks.polls')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetCrowdfundings.id,
                        CanGetCrowdfunding.id,
                        CanCreateCrowdfunding.id,
                        CanUpdateCrowdfunding.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/crowdfundings"
                        active={path === 'crowdfundings'}
                        icon={<MdMoney />}
                      >
                        {t('navbar.blocks.crowdfundings')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanCreateBlockStyle.id,
                        CanUpdateBlockStyle.id,
                        CanDeleteBlockStyle.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/block-content/styles"
                        active={path === 'block-content/styles'}
                        icon={<MdStyle />}
                      >
                        {t('navbar.blocks.blockStyles')}
                      </Nav.Item>
                    </PermissionControl>
                    <PermissionControl
                      qualifyingPermissions={[
                        CanCreateBlockTemplate.id,
                        CanUpdateBlockTemplate.id,
                        CanDeleteBlockTemplate.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/block-content/templates"
                        active={path === 'block-content/templates'}
                        icon={<MdContentCopy />}
                      >
                        {t('navbar.blocks.blockTemplates')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    CanGetComments.id,
                    CanGetTags.id,
                    CanGetCommentRatingSystem.id,
                  ]}
                >
                  <Nav.Menu
                    eventKey={'comments'}
                    title={t('navbar.comments')}
                    icon={<MdChat />}
                  >
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetComments.id,
                        CanUpdateComments.id,
                        CanTakeActionOnComment.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/comments"
                        icon={<MdChat />}
                        active={path === 'comments'}
                      >
                        {t('navbar.comments')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetTags.id,
                        CanCreateTag.id,
                        CanUpdateTag.id,
                        CanDeleteTag.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/comments/tags"
                        icon={<MdSell />}
                        active={path === 'comments/tags'}
                      >
                        {t('navbar.commentTags')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetCommentRatingSystem.id,
                        CanCreateCommentRatingSystem.id,
                        CanUpdateCommentRatingSystem.id,
                        CanDeleteCommentRatingSystem.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/comments/rating"
                        icon={<MdStar />}
                        active={path === 'comments/rating'}
                      >
                        {t('navbar.commentRating')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    CanGetEvent.id,
                    CanGetCommentRatingSystem.id,
                  ]}
                >
                  <Nav.Menu
                    eventKey={'events'}
                    title={t('navbar.events')}
                    icon={<MdEvent />}
                  >
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetEvent.id,
                        CanUpdateEvent.id,
                        CanDeleteEvent.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/events"
                        icon={<MdEvent />}
                        active={path === 'events'}
                      >
                        {t('navbar.events')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* @TODO: Disabled until HTML to PM works */}
                    {/* <PermissionControl
                      qualifyingPermissions={[
                        CanGetEvent.id,
                        CanUpdateEvent.id,
                        CanDeleteEvent.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/events/import"
                        icon={<MdEventAvailable />}
                        active={path === 'events/import'}
                      >
                        {t('navbar.importableEvents')}
                      </Nav.Item>
                    </PermissionControl> */}

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetTags.id,
                        CanCreateTag.id,
                        CanUpdateTag.id,
                        CanDeleteTag.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/events/tags"
                        icon={<MdSell />}
                        active={path === 'events/tags'}
                      >
                        {t('navbar.eventTags')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
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
                  <Nav.Menu
                    eventKey={'media'}
                    title={t('navbar.media')}
                    icon={<MdPhoto />}
                  >
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetImages.id,
                        CanGetImage.id,
                        CanCreateImage.id,
                        CanDeleteImage.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/images"
                        icon={<MdPhoto />}
                        active={path === 'images'}
                      >
                        {t('navbar.imageLibrary')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetDocuments.id,
                        CanGetDocument.id,
                        CanCreateDocument.id,
                        CanDeleteDocument.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/documents"
                        icon={<MdDescription />}
                        active={path === 'documents'}
                      >
                        {t('navbar.documentLibrary')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    CanGetNavigations.id,
                    CanGetNavigation.id,
                    CanCreateNavigation.id,
                    CanDeleteNavigation.id,
                  ]}
                >
                  <Nav.Item
                    as={NavLink}
                    href="/navigations"
                    icon={<MdLocationPin />}
                    active={path === 'navigations'}
                  >
                    {t('navbar.navigations')}
                  </Nav.Item>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    CanGetBanners.id,
                    CanGetBanner.id,
                    CanCreateBanner.id,
                    CanDeleteBanner.id,
                  ]}
                >
                  <Nav.Item
                    as={NavLink}
                    href="/banners"
                    icon={<MdSignpost />}
                    active={path === 'banners'}
                  >
                    {t('navbar.banners')}
                  </Nav.Item>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[CanGetAuthors.id, CanGetTags.id]}
                >
                  <Nav.Menu
                    eventKey={'authors'}
                    title={t('navbar.authors')}
                    icon={<MdGroup />}
                  >
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetAuthors.id,
                        CanGetAuthor.id,
                        CanCreateAuthor.id,
                        CanDeleteAuthor.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/authors"
                        icon={<MdGroup />}
                        active={path === 'authors'}
                      >
                        {t('navbar.authors')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetTags.id,
                        CanCreateTag.id,
                        CanUpdateTag.id,
                        CanDeleteTag.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/authors/tags"
                        icon={<MdSell />}
                        active={path === 'authors/tags'}
                      >
                        {t('navbar.authorTags')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
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
                  <Nav.Menu
                    eventKey={'audience'}
                    title={t('navbar.audience')}
                    icon={<MdGroups />}
                  >
                    <PermissionControl
                      qualifyingPermissions={[CanGetAudienceStats.id]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/audience/dashboard"
                        active={path.includes('audience/dashboard')}
                        icon={<MdMultilineChart />}
                      >
                        {t('navbar.audienceDashboard')}
                      </Nav.Item>
                    </PermissionControl>

                    <Nav.Item
                      as={NavLink}
                      href="/users"
                      active={path === 'users'}
                      icon={<MdAccountCircle />}
                    >
                      {t('navbar.users')}
                    </Nav.Item>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetSubscriptions.id,
                        CanGetSubscription.id,
                        CanCreateSubscription.id,
                        CanDeleteSubscription.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/subscriptions"
                        active={path === 'subscriptions'}
                        icon={<MdAutorenew />}
                      >
                        {t('navbar.subscriptions')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanCreateConsent.id,
                        CanUpdateConsent.id,
                        CanDeleteConsent.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/consents"
                        active={path === 'consents'}
                        icon={<MdApproval />}
                      >
                        {t('navbar.consents')}
                      </Nav.Item>
                      <Nav.Item
                        as={NavLink}
                        href="/userConsents"
                        active={path === 'userConsents'}
                        icon={<MdFactCheck />}
                      >
                        {t('navbar.userConsents')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                {/* COMMUNICATION */}
                <PermissionControl
                  qualifyingPermissions={[
                    CanGetMailTemplates.id,
                    CanUpdateMailTemplates.id,
                    CanGetSystemMails.id,
                    CanUpdateSystemMails.id,
                    CanSendMailTemplates.id,
                    CanGetMailLogs.id,
                    CanGetSubscriptionFlows.id,
                  ]}
                >
                  <Nav.Menu
                    eventKey={'communication'}
                    title={t('navbar.communication')}
                    icon={<MdMail />}
                  >
                    {/* SEND MAIL */}
                    <PermissionControl
                      qualifyingPermissions={[CanSendMailTemplates.id]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/mailsend"
                        active={path === 'mailsend'}
                        icon={<MdSend />}
                      >
                        {t('navbar.mailSend')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* AUTOMATIC MAILS (subscription mailing + system mails) */}
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetSubscriptionFlows.id,
                        CanGetSystemMails.id,
                        CanUpdateSystemMails.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/communicationflows/edit/default"
                        active={path === 'communicationflows/edit/default'}
                        icon={<MdOutgoingMail />}
                      >
                        {t('navbar.subscriptionSettings')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* MAIL TEMPLATES */}
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetMailTemplates.id,
                        CanUpdateMailTemplates.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/mailtemplates"
                        active={path === 'mailtemplates'}
                        icon={<MdMail />}
                      >
                        {t('navbar.mailTemplates')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* SENT MAILS */}
                    <PermissionControl
                      qualifyingPermissions={[CanGetMailLogs.id]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/maillog"
                        active={path === 'maillog'}
                        icon={<MdOutgoingMail />}
                      >
                        {t('navbar.mailLog')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
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
                  <Nav.Menu
                    eventKey={'usersAndSubscriptions'}
                    title={t('navbar.subscriptionPlans')}
                    icon={<MdBadge />}
                  >
                    {/* SUBSCRIPTION PLANS */}
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetMemberPlans.id,
                        CanGetMemberPlan.id,
                        CanCreateMemberPlan.id,
                        CanDeleteMemberPlan.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/memberplans"
                        active={path === 'memberplans'}
                        icon={<MdBookOnline />}
                      >
                        {t('navbar.memberPlans')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* PAYMENT METHODS */}
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetPaymentMethods.id,
                        CanGetPaymentMethod.id,
                        CanCreatePaymentMethod.id,
                        CanDeletePaymentMethod.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/paymentmethods"
                        active={path === 'paymentmethods'}
                        icon={<MdCreditCard />}
                      >
                        {t('navbar.paymentMethods')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* DISCOUNTCODES */}
                    <PermissionControl
                      qualifyingPermissions={[
                        CanCreateDiscountCode.id,
                        CanUpdateDiscountCode.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/discountCodes"
                        icon={<MdCountertops />}
                        active={path === 'discountCodes'}
                      >
                        {t('discountCode.navbar')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanCreateGoodie.id,
                        CanUpdateGoodie.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/goodies"
                        icon={<MdCardGiftcard />}
                        active={path === 'goodies'}
                      >
                        {t('goodie.navbar')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    CanGetPeers.id,
                    CanGetPeer.id,
                    CanCreatePeer.id,
                    CanDeletePeer.id,
                  ]}
                >
                  <Nav.Menu
                    eventKey={'peering'}
                    title={t('navbar.peering')}
                    icon={<MdSettingsInputAntenna />}
                  >
                    <Nav.Item
                      as={NavLink}
                      href="/peering"
                      active={path === 'peering'}
                      icon={<MdPersonAddAlt1 />}
                    >
                      {t('navbar.peers')}
                    </Nav.Item>
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetTokens.id,
                        CanCreateToken.id,
                        CanDeleteToken.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/tokens"
                        active={path === 'tokens'}
                        icon={<MdVpnKey />}
                      >
                        {t('navbar.tokens')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                {/* SETTINGS */}
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
                  <Nav.Menu
                    eventKey={'settings'}
                    icon={<MdSettings />}
                    title={t('navbar.settings')}
                  >
                    {/* AUDIT LOG */}
                    <PermissionControl
                      qualifyingPermissions={[CanGetAuditLogs.id]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/audit-log"
                        active={path === 'audit-log'}
                        icon={<MdHistory />}
                      >
                        {t('navbar.auditLog')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* DIVERSE SETTINGS */}
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetSettings.id,
                        CanUpdateSettings.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/settings"
                        active={path === 'settings'}
                        icon={<MdSettings />}
                      >
                        {t('navbar.settings')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* USER ROLES */}
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetUserRoles.id,
                        CanGetUserRole.id,
                        CanCreateUserRole.id,
                        CanDeleteUserRole.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/userroles"
                        active={path === 'userroles'}
                        icon={<MdBadge />}
                      >
                        {t('navbar.userRoles')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* INTEGRATIONS */}
                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetAISettings.id,
                        CanGetChallengeProviderSettings.id,
                        CanGetPaymentProviderSettings.id,
                        CanGetTrackingPixelSettings.id,
                        CanGetMailProviderSettings.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/integrations"
                        active={path === 'integrations'}
                        icon={<MdPower />}
                      >
                        {t('navbar.integrations')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        CanGetWebsiteSettings.id,
                        CanUpdateWebsiteSettings.id,
                      ]}
                    >
                      <Nav.Item
                        as={NavLink}
                        href="/settings/website"
                        active={path.startsWith('settings/website')}
                        icon={<MdAutoFixHigh />}
                      >
                        {t('websiteSettings.navbar')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>
              </Nav>
            </RSidenav.Body>
          </Sidenav>

          <Footer
            appearance="default"
            justifyContent="start"
          >
            <Nav>
              <Nav.Menu
                placement="topStart"
                trigger="click"
                renderToggle={(
                  props: object,
                  ref: React.Ref<HTMLButtonElement>
                ) => (
                  <IconButton
                    {...props}
                    appearance="subtle"
                    placement="left"
                    ref={ref}
                    icon={<MdLogout />}
                  />
                )}
              >
                <Nav.Item
                  as={NavLink}
                  href="/logout"
                >
                  {t('navbar.logout')}
                </Nav.Item>
              </Nav.Menu>
            </Nav>

            <Nav>
              <Nav.Menu
                placement="topStart"
                trigger="click"
                renderToggle={(
                  props: object,
                  ref: React.Ref<HTMLButtonElement>
                ) => (
                  <IconButton
                    {...props}
                    appearance="subtle"
                    placement="left"
                    ref={ref}
                    icon={<MdTranslate />}
                  />
                )}
              >
                {AVAILABLE_LANG.map(lang => (
                  <Nav.Item
                    key={lang.id}
                    onSelect={() => setUILanguage(lang.id)}
                    active={lang.id === uiLanguage}
                  >
                    {lang.name}
                  </Nav.Item>
                ))}
              </Nav.Menu>
            </Nav>

            <Nav>
              <Nav.Menu
                placement="topStart"
                trigger="click"
                renderToggle={(
                  props: object,
                  ref: React.Ref<HTMLButtonElement>
                ) => (
                  <IconButton
                    {...props}
                    appearance="subtle"
                    placement="left"
                    ref={ref}
                    icon={colorModeIcons[colorModePreference]}
                    title={t('navbar.colorMode.title')}
                    aria-label={t('navbar.colorMode.title')}
                  />
                )}
              >
                {colorModePreferences.map(preference => (
                  <Nav.Item
                    key={preference}
                    icon={colorModeIcons[preference]}
                    onSelect={() => setColorMode(preference)}
                    active={preference === colorModePreference}
                  >
                    {t(`navbar.colorMode.${preference}`)}
                  </Nav.Item>
                ))}
              </Nav.Menu>
            </Nav>
          </Footer>

          <Version />
        </Sidebar>
        <ChildrenContainer>{children}</ChildrenContainer>
      </Layout>
    </Wrapper>
  );
}
