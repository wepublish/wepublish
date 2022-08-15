import React, {ReactNode, useEffect, useState} from 'react'

import {Container, Sidebar, Sidenav, Nav, Navbar, Dropdown, IconButton} from 'rsuite'
import {
  ArticleListRoute,
  AuthorListRoute,
  CommentListRoute,
  ImageListRoute,
  LogoutRoute,
  MemberPlanListRoute,
  NavigationListRoute,
  PageListRoute,
  PaymentMethodListRoute,
  PeerArticleListRoute,
  PeerListRoute,
  routeLink,
  RouteType,
  SettingListRoute,
  SubscriptionListRoute,
  TokenListRoute,
  UserListRoute,
  useRoute,
  UserRoleListRoute
} from './route'
import AngleLeftIcon from '@rsuite/icons/legacy/AngleLeft'
import AngleRightIcon from '@rsuite/icons/legacy/AngleRight'
import FileTextIcon from '@rsuite/icons/legacy/FileText'
import FileTextOIcon from '@rsuite/icons/legacy/FileTextO'
import FrameIcon from '@rsuite/icons/legacy/Frame'
import CommentIcon from '@rsuite/icons/legacy/Comment'
import ImageIcon from '@rsuite/icons/legacy/Image'
import BarsIcon from '@rsuite/icons/legacy/Bars'
import PeopleGroupIcon from '@rsuite/icons/legacy/PeopleGroup'
import PeoplesIcon from '@rsuite/icons/legacy/Peoples'
import UserCircleIcon from '@rsuite/icons/legacy/UserCircle'
import CharacterAuthorizeIcon from '@rsuite/icons/legacy/CharacterAuthorize'
import MehOIcon from '@rsuite/icons/legacy/MehO'
import IdCardIcon from '@rsuite/icons/legacy/IdCard'
import ShareIcon from '@rsuite/icons/legacy/Share'
import KeyIcon from '@rsuite/icons/legacy/Key'
import CogIcon from '@rsuite/icons/legacy/Cog'
import GlobeIcon from '@rsuite/icons/legacy/Globe'
import CreditCardIcon from '@rsuite/icons/legacy/CreditCard'
import {useTranslation} from 'react-i18next'
import {PermissionControl} from './atoms/permissionControl'

export interface BaseProps {
  children?: ReactNode
}

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
const NavItemLink = routeLink(Nav.Item)
const DropdownItemLink = routeLink(Dropdown.Item)

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
  const {current} = useRoute()

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
                  left: isExpanded ? 260 : 56,
                  transform: 'translate(-50%)',
                  zIndex: 100
                }}
                className="collapse-nav-btn"
                appearance="primary"
                circle
                size="xs"
                onClick={() => setIsExpanded(!isExpanded)}
                icon={
                  isExpanded ? (
                    <AngleLeftIcon style={{fontSize: '1.3333em'}} />
                  ) : (
                    <AngleRightIcon style={{fontSize: '1.3333em'}} />
                  )
                }
              />

              <Nav>
                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_ARTICLES',
                    'CAN_GET_ARTICLE',
                    'CAN_CREATE_ARTICLE',
                    'CAN_DELETE_ARTICLE',
                    'CAN_PUBLISH_ARTICLE'
                  ]}
                  showRejectionMessage={false}>
                  <NavItemLink
                    icon={<FileTextIcon />}
                    route={ArticleListRoute.create({})}
                    active={
                      current?.type === RouteType.ArticleList || current?.type === RouteType.Index
                    }>
                    {t('navbar.articles')}
                  </NavItemLink>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={['CAN_GET_PEER_ARTICLES', 'CAN_GET_PEER_ARTICLE']}
                  showRejectionMessage={false}>
                  <NavItemLink
                    icon={<FileTextOIcon />}
                    route={PeerArticleListRoute.create({})}
                    active={current?.type === RouteType.PeerArticleList}>
                    {t('navbar.peerArticles')}
                  </NavItemLink>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_PAGES',
                    'CAN_GET_PAGE',
                    'CAN_CREATE_PAGE',
                    'CAN_DELETE_PAGE',
                    'CAN_PUBLISH_PAGE'
                  ]}
                  showRejectionMessage={false}>
                  <NavItemLink
                    icon={<FrameIcon />}
                    route={PageListRoute.create({})}
                    active={current?.type === RouteType.PageList}>
                    {t('navbar.pages')}
                  </NavItemLink>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={['CAN_GET_COMMENTS', 'CAN_TAKE_COMMENT_ACTION']}
                  showRejectionMessage={false}>
                  <NavItemLink
                    icon={<CommentIcon />}
                    route={CommentListRoute.create({})}
                    active={current?.type === RouteType.CommentList}>
                    {t('navbar.comments')}
                  </NavItemLink>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_IMAGES',
                    'CAN_GET_IMAGE',
                    'CAN_CREATE_IMAGE',
                    'CAN_DELETE_IMAGE'
                  ]}
                  showRejectionMessage={false}>
                  <NavItemLink
                    icon={<ImageIcon />}
                    route={ImageListRoute.create({})}
                    active={current?.type === RouteType.ImageList}>
                    {t('navbar.imageLibrary')}
                  </NavItemLink>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_NAVIGATIONS',
                    'CAN_GET_NAVIGATION',
                    'CAN_CREATE_NAVIGATION',
                    'CAN_DELETE_NAVIGATION'
                  ]}
                  showRejectionMessage={false}>
                  <NavItemLink
                    icon={<BarsIcon />}
                    route={NavigationListRoute.create({})}
                    active={current?.type === RouteType.NavigationList}>
                    {t('navbar.navigations')}
                  </NavItemLink>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_AUTHORS',
                    'CAN_GET_AUTHOR',
                    'CAN_CREATE_AUTHOR',
                    'CAN_DELETE_AUTHOR'
                  ]}
                  showRejectionMessage={false}>
                  <NavItemLink
                    icon={<PeopleGroupIcon />}
                    route={AuthorListRoute.create({})}
                    active={current?.type === RouteType.AuthorList}>
                    {t('navbar.authors')}
                  </NavItemLink>
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
                  ]}
                  showRejectionMessage={false}>
                  <Dropdown
                    eventKey={'1'}
                    title={t('navbar.usersAndMembers')}
                    icon={<PeoplesIcon />}>
                    <DropdownItemLink
                      active={current?.type === RouteType.UserList}
                      icon={<UserCircleIcon />}
                      route={UserListRoute.create({})}>
                      {t('navbar.users')}
                    </DropdownItemLink>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_USER_ROLES',
                        'CAN_GET_USER_ROLE',
                        'CAN_CREATE_USER_ROLE',
                        'CAN_DELETE_USER_ROLE'
                      ]}
                      showRejectionMessage={false}>
                      <DropdownItemLink
                        active={current?.type === RouteType.UserRoleList}
                        icon={<CharacterAuthorizeIcon />}
                        route={UserRoleListRoute.create({})}>
                        {t('navbar.userRoles')}
                      </DropdownItemLink>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_SUBSCRIPTIONS',
                        'CAN_GET_SUBSCRIPTION',
                        'CAN_CREATE_SUBSCRIPTION',
                        'CAN_DELETE_SUBSCRIPTION'
                      ]}
                      showRejectionMessage={false}>
                      <DropdownItemLink
                        active={current?.type === RouteType.SubscriptionList}
                        icon={<MehOIcon />}
                        route={SubscriptionListRoute.create({})}>
                        {t('navbar.subscriptions')}
                      </DropdownItemLink>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_MEMBER_PLANS',
                        'CAN_GET_MEMBER_PLAN',
                        'CAN_CREATE_MEMBER_PLAN',
                        'CAN_DELETE_MEMBER_PLAN'
                      ]}>
                      <DropdownItemLink
                        active={current?.type === RouteType.MemberPlanList}
                        icon={<IdCardIcon />}
                        route={MemberPlanListRoute.create({})}>
                        {t('navbar.memberPlans')}
                      </DropdownItemLink>
                    </PermissionControl>

                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_PAYMENT_METHODS',
                        'CAN_GET_PAYMENT_METHOD',
                        'CAN_CREATE_PAYMENT_METHOD',
                        'CAN_DELETE_PAYMENT_METHOD'
                      ]}
                      showRejectionMessage={false}>
                      <DropdownItemLink
                        active={current?.type === RouteType.PaymentMethodList}
                        icon={<CreditCardIcon />}
                        route={PaymentMethodListRoute.create({})}>
                        {t('navbar.paymentMethods')}
                      </DropdownItemLink>
                    </PermissionControl>
                  </Dropdown>
                </PermissionControl>

                <PermissionControl
                  qualifyingPermissions={[
                    'CAN_GET_PEERS',
                    'CAN_GET_PEER',
                    'CAN_CREATE_PEER',
                    'CAN_DELETE_PEER'
                  ]}>
                  <Dropdown title={t('navbar.peering')} icon={<ShareIcon />}>
                    <DropdownItemLink
                      active={current?.type === RouteType.PeerList}
                      icon={<ShareIcon />}
                      route={PeerListRoute.create({})}>
                      {t('navbar.peers')}
                    </DropdownItemLink>
                    <PermissionControl
                      qualifyingPermissions={[
                        'CAN_GET_TOKENS',
                        'CAN_CREATE_TOKEN',
                        'CAN_DELETE_TOKEN'
                      ]}
                      showRejectionMessage={false}>
                      <DropdownItemLink
                        active={current?.type === RouteType.TokenList}
                        icon={<KeyIcon />}
                        route={TokenListRoute.create({})}>
                        {t('navbar.tokens')}
                      </DropdownItemLink>
                    </PermissionControl>
                  </Dropdown>
                </PermissionControl>
                <PermissionControl
                  qualifyingPermissions={['CAN_GET_SETTINGS', 'CAN_UPDATE_SETTINGS']}
                  showRejectionMessage={false}>
                  <NavItemLink
                    active={current?.type === RouteType.SettingList}
                    icon={<CogIcon />}
                    route={SettingListRoute.create({})}>
                    {t('navbar.settings')}
                  </NavItemLink>
                </PermissionControl>
              </Nav>
            </Sidenav.Body>
          </Sidenav>
          <Navbar appearance="default" className="nav-toggle">
            <Nav>
              <Dropdown
                placement="topStart"
                trigger="click"
                renderToggle={(props: unknown, ref: React.Ref<HTMLButtonElement>) => (
                  <IconButton
                    {...props}
                    placement="left"
                    ref={ref}
                    style={iconStyles}
                    className="icon-selector"
                    icon={<BarsIcon />}
                  />
                )}>
                <DropdownItemLink route={LogoutRoute.create({})}>
                  {t('navbar.logout')}
                </DropdownItemLink>
              </Dropdown>
            </Nav>
            <Nav>
              <Dropdown
                placement="topStart"
                trigger="click"
                renderToggle={(props: unknown, ref: React.Ref<HTMLButtonElement>) => (
                  <IconButton
                    {...props}
                    placement="left"
                    ref={ref}
                    style={iconStyles}
                    className="icon-selector"
                    icon={<GlobeIcon />}
                  />
                )}>
                {AVAILABLE_LANG.map(lang => (
                  <Dropdown.Item
                    key={lang.id}
                    onSelect={() => setUILanguage(lang.id)}
                    active={lang.id === uiLanguage}>
                    {lang.name}
                  </Dropdown.Item>
                ))}
              </Dropdown>
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
