import React, {ReactNode, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  MdAccountCircle,
  MdAutorenew,
  MdBadge,
  MdBookOnline,
  MdChat,
  MdChevronLeft,
  MdChevronRight,
  MdCreditCard,
  MdDashboard,
  MdDescription,
  MdFileCopy,
  MdGroup,
  MdGroups,
  MdLocationPin,
  MdLogout,
  MdOutlineGridView,
  MdPersonAddAlt1,
  MdPhoto,
  MdQueryStats,
  MdSell,
  MdSettings,
  MdSettingsInputAntenna,
  MdStar,
  MdTranslate,
  MdVpnKey
} from 'react-icons/md'
import {Link, useLocation} from 'react-router-dom'
import {Container, IconButton, Nav, Navbar, Sidebar, Sidenav} from 'rsuite'

import {PermissionControl} from './atoms/permissionControl'

export interface BaseProps {
  children?: ReactNode
}

const NavLink = React.forwardRef<HTMLAnchorElement, any>(({href, children, ...rest}, ref) => (
  <Link ref={ref} to={href} {...rest}>
    {children}
  </Link>
))

const AVAILABLE_LANG = [
  {id: 'en', lang: 'en_US', name: 'English'},
  {id: 'fr', lang: 'fr_FR', name: 'Français'},
  {id: 'de', lang: 'de_CH', name: 'Deutsch'}
]

const iconStyles = {
  width: 56,
  height: 56,
  lineHeight: '56px',
  textAlign: 'center' as const
}

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
    <div style={{display: 'flex', height: '100vh', width: '100vw'}}>
      <Container>
        <Sidebar
          style={{display: 'flex', flexDirection: 'column'}}
          width={isExpanded ? 260 : 56}
          collapsible>
          <Sidenav
            expanded={isExpanded}
            defaultOpenKeys={['1']}
            appearance="default"
            style={{flex: '1 1 auto'}}>
            <Sidenav.Body>
              <IconButton
                style={{
                  position: 'absolute',
                  top: '5vh',
                  transform: `translateX(${isExpanded ? '243px' : '38px'})`,
                  transition: 'transform 0.2s ease-in',
                  zIndex: 100
                }}
                className="collapse-nav-btn"
                appearance="primary"
                circle
                size="xs"
                onClick={() => setIsExpanded(!isExpanded)}
                icon={
                  isExpanded ? (
                    <MdChevronLeft style={{fontSize: '1.3333em'}} />
                  ) : (
                    <MdChevronRight style={{fontSize: '1.3333em'}} />
                  )
                }
              />

              <Nav style={{marginTop: '1rem'}}>
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
                    href="/peerarticles"
                    icon={<MdFileCopy />}
                    active={path === 'peerarticles'}>
                    {t('navbar.peerArticles')}
                  </Nav.Item>
                </PermissionControl>

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
                    active={path === 'pages'}>
                    {t('navbar.pages')}
                  </Nav.Item>
                </PermissionControl>

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

                <PermissionControl
                  qualifyingPermissions={['CAN_GET_POLL', 'CAN_CREATE_POLL', 'CAN_DELETE_POLL']}>
                  <Nav.Menu
                    eventKey={'poll'}
                    title={t('navbar.blocks.topMenu')}
                    icon={<MdOutlineGridView />}>
                    <Nav.Item
                      as={NavLink}
                      href="/polls"
                      active={path === 'polls'}
                      icon={<MdQueryStats />}>
                      {t('navbar.blocks.polls')}
                    </Nav.Item>
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
                    'CAN_DELETE_SUBSCRIPTION',
                    'CAN_GET_MEMBER_PLAN',
                    'CAN_GET_MEMBER_PLANS',
                    'CAN_CREATE_MEMBER_PLAN',
                    'CAN_DELETE_MEMBER_PLAN',
                    'CAN_CREATE_PAYMENT_METHOD',
                    'CAN_GET_PAYMENT_METHODS',
                    'CAN_DELETE_PAYMENT_METHOD'
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
              </Nav>
            </Sidenav.Body>
          </Sidenav>
          <Navbar appearance="default" className="nav-toggle">
            <Nav>
              <Nav.Menu
                placement="topStart"
                trigger="click"
                renderToggle={(props: unknown, ref: React.Ref<HTMLButtonElement>) => (
                  <IconButton
                    {...props}
                    placement="left"
                    ref={ref}
                    style={iconStyles}
                    className="icon-selector"
                    icon={<MdLogout />}
                  />
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
                renderToggle={(props: unknown, ref: React.Ref<HTMLButtonElement>) => (
                  <IconButton
                    {...props}
                    placement="left"
                    ref={ref}
                    style={iconStyles}
                    className="icon-selector"
                    icon={<MdTranslate />}
                  />
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
        <Container
          style={{
            paddingTop: '60px',
            paddingBottom: '60px',
            paddingLeft: '40px',
            paddingRight: '40px',
            overflowY: 'scroll'
          }}>
          {children}
        </Container>
      </Container>
    </div>
  )
}
