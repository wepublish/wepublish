import styled from '@emotion/styled'
import {PermissionControl, Version} from '@wepublish/ui/editor'
import {de, enUS, fr} from 'date-fns/locale'
import {forwardRef, ReactNode, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  MdAccountCircle,
  MdApproval,
  MdAutorenew,
  MdBadge,
  MdBookOnline,
  MdChat,
  MdChevronLeft,
  MdChevronRight,
  MdCreditCard,
  MdDashboard,
  MdDescription,
  MdEvent,
  MdEventAvailable,
  MdFactCheck,
  MdFileCopy,
  MdGroup,
  MdGroups,
  MdLocationPin,
  MdLogout,
  MdMail,
  MdOutgoingMail,
  MdOutlineGridView,
  MdPersonAddAlt1,
  MdPhoto,
  MdPieChartOutline,
  MdQueryStats,
  MdSell,
  MdSettings,
  MdSettingsInputAntenna,
  MdStar,
  MdStyle,
  MdTranslate,
  MdVpnKey
} from 'react-icons/md'
import {Link, useLocation} from 'react-router-dom'
import {
  Container,
  IconButton as RIconButton,
  Nav,
  Navbar,
  Sidebar as RSidebar,
  Sidenav as RSidenav
} from 'rsuite'

export interface BaseProps {
  children?: ReactNode
}

const NavLink = forwardRef<HTMLAnchorElement, any>(({href, children, ...rest}, ref) => (
  <Link ref={ref} to={href} {...rest}>
    {children}
  </Link>
))

export const AVAILABLE_LANG = [
  {id: 'en', lang: 'en_US', name: 'English', locale: enUS},
  {id: 'fr', lang: 'fr_FR', name: 'Français', locale: fr},
  {id: 'de', lang: 'de_CH', name: 'Deutsch', locale: de}
]

function useStickyState(defaultValue: string, key: string) {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key)
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

const Wrapper = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
`

const Sidebar = styled(RSidebar)`
  display: flex;
  flex-direction: column;
`

const Sidenav = styled(RSidenav)`
  flex: 1 1 auto;
  overflow-y: auto;
`

const IconButton = styled(RIconButton)`
  width: 56px;
  height: 56px;
  line-height: 56px;
  text-align: center;

  svg {
    position: absolute;
    top: 20px;
    left: 20px;
  }
`

const FloatingButton = styled(RIconButton)`
  display: block;
  padding: 6px;
  position: absolute;
  top: 5vh;
  transition: transform 0.2s ease-in, opacity 0.15s ease-in-out;
  z-index: 100;
  transform: translateX(${props => (props.isExpanded ? '241px' : '37px')});

  .rs-sidebar:hover & {
    opacity: 1;
  }
`

const Navigation = styled(Nav)`
  margin-top: 1rem;
`

const ChildrenContainer = styled(Container)`
  padding: 60px 40px 40px 40px;
  overflow-y: auto;
  max-width: calc(100vw - 260px);
`

export function Base({children}: BaseProps) {
  const {pathname} = useLocation()
  const path = pathname.substring(1)

  const {t, i18n} = useTranslation()

  const [isExpanded, setIsExpanded] = useState(true)

  const [uiLanguage, setUILanguage] = useStickyState(AVAILABLE_LANG[0].id, 'wepublish/language')

  useEffect(() => {
    i18n.changeLanguage(uiLanguage)
  }, [uiLanguage])

  return (
    <Wrapper>
      <Container>
        <Sidebar isExpanded={isExpanded} collapsible width={isExpanded ? 260 : 56}>
          <Sidenav expanded={isExpanded} defaultOpenKeys={['1']} appearance="default">
            <RSidenav.Body>
              <FloatingButton
                isExpanded={isExpanded}
                appearance="primary"
                circle
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                icon={isExpanded ? <MdChevronLeft size="22px" /> : <MdChevronRight size="22px" />}
              />

              <Navigation>
                <Nav.Item
                  as={NavLink}
                  href="/dashboard"
                  icon={<MdPieChartOutline />}
                  active={path === 'dashboard' || path === ''}>
                  {t('navbar.dashboard')}
                </Nav.Item>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_ARTICLES',
                    'CAN_GET_ARTICLE',
                    'CAN_CREATE_ARTICLE',
                    'CAN_DELETE_ARTICLE',
                    'CAN_PUBLISH_ARTICLE',
                    'CAN_GET_ARTICLE_PREVIEW_LINK',
                    'CAN_GET_PEER_ARTICLES',
                    'CAN_GET_PEER_ARTICLE',
                    'CAN_GET_TAGS'
                  ]}>
                  <Nav.Menu
                    eventKey={'articles'}
                    title={t('navbar.articles')}
                    icon={<MdDescription />}>
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_ARTICLES',
                        'CAN_GET_ARTICLE',
                        'CAN_CREATE_ARTICLE',
                        'CAN_DELETE_ARTICLE',
                        'CAN_PUBLISH_ARTICLE',
                        'CAN_GET_ARTICLE_PREVIEW_LINK'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/articles"
                        icon={<MdDescription />}
                        active={path === 'articles'}>
                        {t('navbar.articles')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={['CAN_GET_PEER_ARTICLES', 'CAN_GET_PEER_ARTICLE']}>
                      <Nav.Item
                        as={NavLink}
                        href="/articles/peer"
                        icon={<MdFileCopy />}
                        active={path === 'articles/peer'}>
                        {t('navbar.peerArticles')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_TAGS',
                        'CAN_CREATE_TAG',
                        'CAN_UPDATE_TAG',
                        'CAN_DELETE_TAG'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/articles/tags"
                        icon={<MdSell />}
                        active={path === 'articles/tags'}>
                        {t('navbar.articleTags')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_PAGES',
                    'CAN_GET_PAGE',
                    'CAN_CREATE_PAGE',
                    'CAN_DELETE_PAGE',
                    'CAN_PUBLISH_PAGE',
                    'CAN_GET_PAGE_PREVIEW_LINK',
                    'CAN_GET_TAGS'
                  ]}>
                  <Nav.Menu eventKey={'pages'} title={t('navbar.pages')} icon={<MdDashboard />}>
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_PAGES',
                        'CAN_GET_PAGE',
                        'CAN_CREATE_PAGE',
                        'CAN_DELETE_PAGE',
                        'CAN_PUBLISH_PAGE',
                        'CAN_GET_PAGE_PREVIEW_LINK'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/pages"
                        icon={<MdDashboard />}
                        active={path === 'page'}>
                        {t('navbar.pages')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_TAGS',
                        'CAN_CREATE_TAG',
                        'CAN_UPDATE_TAG',
                        'CAN_DELETE_TAG'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/pages/tags"
                        icon={<MdSell />}
                        active={path === 'pages/tags'}>
                        {t('navbar.pageTags')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_POLL',
                    'CAN_CREATE_POLL',
                    'CAN_DELETE_POLL',
                    'CAN_CREATE_BLOCK_STYLE',
                    'CAN_UPDATE_BLOCK_STYLE',
                    'CAN_DELETE_BLOCK_STYLE'
                  ]}>
                  <Nav.Menu
                    eventKey={'block-content'}
                    title={t('navbar.blocks.topMenu')}
                    icon={<MdOutlineGridView />}>
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_POLL',
                        'CAN_CREATE_POLL',
                        'CAN_DELETE_POLL'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/polls"
                        active={path === 'polls'}
                        icon={<MdQueryStats />}>
                        {t('navbar.blocks.polls')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_CREATE_BLOCK_STYLE',
                        'CAN_UPDATE_BLOCK_STYLE',
                        'CAN_DELETE_BLOCK_STYLE'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/block-content/styles"
                        active={path === 'block-content/styles'}
                        icon={<MdStyle />}>
                        {t('navbar.blocks.blockStyles')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_COMMENTS',
                    'CAN_GET_TAGS',
                    'CAN_GET_COMMENT_RATING_SYSTEM'
                  ]}>
                  <Nav.Menu eventKey={'comments'} title={t('navbar.comments')} icon={<MdChat />}>
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_COMMENTS',
                        'CAN_UPDATE_COMMENTS',
                        'CAN_TAKE_COMMENT_ACTION'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/comments"
                        icon={<MdChat />}
                        active={path === 'comments'}>
                        {t('navbar.comments')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_TAGS',
                        'CAN_CREATE_TAG',
                        'CAN_UPDATE_TAG',
                        'CAN_DELETE_TAG'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/comments/tags"
                        icon={<MdSell />}
                        active={path === 'comments/tags'}>
                        {t('navbar.commentTags')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_COMMENT_RATING_SYSTEM',
                        'CAN_CREATE_COMMENT_RATING_SYSTEM',
                        'CAN_UPDATE_COMMENT_RATING_SYSTEM',
                        'CAN_DELETE_COMMENT_RATING_SYSTEM'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/comments/rating"
                        icon={<MdStar />}
                        active={path === 'comments/rating'}>
                        {t('navbar.commentRating')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={['CAN_GET_EVENT', 'CAN_GET_COMMENT_RATING_SYSTEM']}>
                  <Nav.Menu eventKey={'events'} title={t('navbar.events')} icon={<MdEvent />}>
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_EVENT',
                        'CAN_UPDATE_EVENT',
                        'CAN_DELETE_EVENT'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/events"
                        icon={<MdEvent />}
                        active={path === 'events'}>
                        {t('navbar.events')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_EVENT',
                        'CAN_UPDATE_EVENT',
                        'CAN_DELETE_EVENT'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/events/import"
                        icon={<MdEventAvailable />}
                        active={path === 'events/import'}>
                        {t('navbar.importableEvents')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_TAGS',
                        'CAN_CREATE_TAG',
                        'CAN_UPDATE_TAG',
                        'CAN_DELETE_TAG'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/events/tags"
                        icon={<MdSell />}
                        active={path === 'events/tags'}>
                        {t('navbar.eventTags')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_IMAGES',
                    'CAN_GET_IMAGE',
                    'CAN_CREATE_IMAGE',
                    'CAN_DELETE_IMAGE'
                  ]}>
                  <Nav.Item
                    as={NavLink}
                    href="/images"
                    icon={<MdPhoto />}
                    active={path === 'images'}>
                    {t('navbar.imageLibrary')}
                  </Nav.Item>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_NAVIGATIONS',
                    'CAN_GET_NAVIGATION',
                    'CAN_CREATE_NAVIGATION',
                    'CAN_DELETE_NAVIGATION'
                  ]}>
                  <Nav.Item
                    as={NavLink}
                    href="/navigations"
                    icon={<MdLocationPin />}
                    active={path === 'navigations'}>
                    {t('navbar.navigations')}
                  </Nav.Item>
                </PermissionControl>

                <PermissionControl qualifyingPermissions={['CAN_GET_AUTHORS', 'CAN_GET_TAGS']}>
                  <Nav.Menu eventKey={'authors'} title={t('navbar.authors')} icon={<MdGroup />}>
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_AUTHORS',
                        'CAN_GET_AUTHOR',
                        'CAN_CREATE_AUTHOR',
                        'CAN_DELETE_AUTHOR'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/authors"
                        icon={<MdGroup />}
                        active={path === 'authors'}>
                        {t('navbar.authors')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_TAGS',
                        'CAN_CREATE_TAG',
                        'CAN_UPDATE_TAG',
                        'CAN_DELETE_TAG'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/authors/tags"
                        icon={<MdSell />}
                        active={path === 'authors/tags'}>
                        {t('navbar.authorTags')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_USERS',
                    'CAN_GET_USER',
                    'CAN_CREATE_USER',
                    'CAN_DELETE_USER',
                    'CAN_CREATE_USER_ROLE',
                    'CAN_GET_USER_ROLE',
                    'CAN_GET_USER_ROLES',
                    'CAN_DELETE_USER_ROLE',
                    'CAN_CREATE_SUBSCRIPTION',
                    'CAN_GET_SUBSCRIPTIONS',
                    'CAN_GET_SUBSCRIPTION',
                    'CAN_DELETE_SUBSCRIPTION'
                  ]}>
                  <Nav.Menu
                    eventKey={'usersAndMembers'}
                    title={t('navbar.usersAndMembers')}
                    icon={<MdGroups />}>
                    <Nav.Item
                      as={NavLink}
                      href="/users"
                      active={path === 'users'}
                      icon={<MdAccountCircle />}>
                      {t('navbar.users')}
                    </Nav.Item>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_SUBSCRIPTIONS',
                        'CAN_GET_SUBSCRIPTION',
                        'CAN_CREATE_SUBSCRIPTION',
                        'CAN_DELETE_SUBSCRIPTION'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/subscriptions"
                        active={path === 'subscriptions'}
                        icon={<MdAutorenew />}>
                        {t('navbar.subscriptions')}
                      </Nav.Item>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_CREATE_CONSENT',
                        'CAN_UPDATE_CONSENT',
                        'CAN_DELETE_CONSENT'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/consents"
                        active={path === 'consents'}
                        icon={<MdApproval />}>
                        {t('navbar.consents')}
                      </Nav.Item>
                      <Nav.Item
                        as={NavLink}
                        href="/userConsents"
                        active={path === 'userConsents'}
                        icon={<MdFactCheck />}>
                        {t('navbar.userConsents')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_MEMBER_PLANS',
                    'CAN_GET_MEMBER_PLAN',
                    'CAN_CREATE_MEMBER_PLAN',
                    'CAN_DELETE_MEMBER_PLAN',
                    'CAN_GET_PAYMENT_METHODS',
                    'CAN_GET_PAYMENT_METHOD',
                    'CAN_CREATE_PAYMENT_METHOD',
                    'CAN_DELETE_PAYMENT_METHOD',
                    'CAN_GET_SUBSCRIPTION_FLOWS'
                  ]}>
                  <Nav.Menu
                    eventKey={'usersAndSubscriptions'}
                    title={t('navbar.subscriptionPlans')}
                    icon={<MdBadge />}>
                    {/* SUBSCRIPTION PLANS */}
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_MEMBER_PLANS',
                        'CAN_GET_MEMBER_PLAN',
                        'CAN_CREATE_MEMBER_PLAN',
                        'CAN_DELETE_MEMBER_PLAN'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/memberplans"
                        active={path === 'memberplans'}
                        icon={<MdBookOnline />}>
                        {t('navbar.memberPlans')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* PAYMENT METHODS */}
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_PAYMENT_METHODS',
                        'CAN_GET_PAYMENT_METHOD',
                        'CAN_CREATE_PAYMENT_METHOD',
                        'CAN_DELETE_PAYMENT_METHOD'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/paymentmethods"
                        active={path === 'paymentmethods'}
                        icon={<MdCreditCard />}>
                        {t('navbar.paymentMethods')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* SUBSCRIPTION MAILING */}
                    <PermissionControl qualifyingPermissions={['CAN_GET_SUBSCRIPTION_FLOWS']}>
                      <Nav.Item
                        as={NavLink}
                        href="/communicationflows/edit/default"
                        active={path === 'communicationflows/edit/default'}
                        icon={<MdOutgoingMail />}>
                        {t('navbar.subscriptionSettings')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_PEERS',
                    'CAN_GET_PEER',
                    'CAN_CREATE_PEER',
                    'CAN_DELETE_PEER'
                  ]}>
                  <Nav.Menu title={t('navbar.peering')} icon={<MdSettingsInputAntenna />}>
                    <Nav.Item
                      as={NavLink}
                      href="/peering"
                      active={path === 'peering'}
                      icon={<MdPersonAddAlt1 />}>
                      {t('navbar.peers')}
                    </Nav.Item>
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_TOKENS',
                        'CAN_CREATE_TOKEN',
                        'CAN_DELETE_TOKEN'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/tokens"
                        active={path === 'tokens'}
                        icon={<MdVpnKey />}>
                        {t('navbar.tokens')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>

                {/* SETTINGS */}
                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_SETTINGS',
                    'CAN_UPDATE_SETTINGS',
                    'CAN_GET_MAIL-TEMPLATES',
                    'CAN_SYNC_MAIL-TEMPLATES',
                    'CAN_GET_USER_ROLES',
                    'CAN_GET_USER_ROLE',
                    'CAN_CREATE_USER_ROLE',
                    'CAN_DELETE_USER_ROLE'
                  ]}>
                  <Nav.Menu icon={<MdSettings />} title={t('navbar.settings')}>
                    {/* DIVERSE SETTINGS */}
                    <PermissionControl
                      qualifyingPermissions={['CAN_GET_SETTINGS', 'CAN_UPDATE_SETTINGS']}>
                      <Nav.Item
                        as={NavLink}
                        href="/settings"
                        active={path === 'settings'}
                        icon={<MdSettings />}>
                        {t('navbar.settings')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* MAIL TEMPLATE SYNC */}
                    <PermissionControl
                      qualifyingPermissions={['CAN_GET_MAIL-TEMPLATES', 'CAN_SYNC_MAIL-TEMPLATES']}>
                      <Nav.Item
                        as={NavLink}
                        href="/mailtemplates"
                        active={path === 'mailtemplates'}
                        icon={<MdMail />}>
                        {t('navbar.mailTemplates')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* SYSTEM MAILS */}
                    <PermissionControl
                      qualifyingPermissions={['CAN_GET_SYSTEM_MAILS', 'CAN_UPDATE_SYSTEM_MAILS']}>
                      <Nav.Item
                        as={NavLink}
                        href="/systemmails"
                        active={path === 'systemmails'}
                        icon={<MdMail />}>
                        {t('navbar.systemMails')}
                      </Nav.Item>
                    </PermissionControl>

                    {/* USER ROLES */}
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_USER_ROLES',
                        'CAN_GET_USER_ROLE',
                        'CAN_CREATE_USER_ROLE',
                        'CAN_DELETE_USER_ROLE'
                      ]}>
                      <Nav.Item
                        as={NavLink}
                        href="/userroles"
                        active={path === 'userroles'}
                        icon={<MdBadge />}>
                        {t('navbar.userRoles')}
                      </Nav.Item>
                    </PermissionControl>
                  </Nav.Menu>
                </PermissionControl>
                <Version />
              </Navigation>
            </RSidenav.Body>
          </Sidenav>
          <Navbar appearance="default">
            <Nav>
              <Nav.Menu
                placement="topStart"
                trigger="click"
                renderToggle={(props: object, ref: React.Ref<HTMLButtonElement>) => (
                  <IconButton {...props} placement="left" ref={ref} icon={<MdLogout />} />
                )}>
                <Nav.Item as={NavLink} href="/logout">
                  {t('navbar.logout')}
                </Nav.Item>
              </Nav.Menu>
            </Nav>
            <Nav>
              <Nav.Menu
                placement="topStart"
                trigger="click"
                renderToggle={(props: object, ref: React.Ref<HTMLButtonElement>) => (
                  <IconButton {...props} placement="left" ref={ref} icon={<MdTranslate />} />
                )}>
                {AVAILABLE_LANG.map(lang => (
                  <Nav.Item
                    key={lang.id}
                    onSelect={() => setUILanguage(lang.id)}
                    active={lang.id === uiLanguage}>
                    {lang.name}
                  </Nav.Item>
                ))}
              </Nav.Menu>
            </Nav>
          </Navbar>
        </Sidebar>
        <ChildrenContainer>{children}</ChildrenContainer>
      </Container>
    </Wrapper>
  )
}
