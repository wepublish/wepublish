import {LinkHOCCompatibleProps} from '@wepublish/karma.run-react'
import React, {ComponentType, ReactNode, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  Container,
  Dropdown,
  DropdownProps,
  Icon,
  IconButton,
  Nav,
  Navbar,
  NavProps,
  Sidebar,
  Sidenav
} from 'rsuite'
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
  SubscriptionListRoute,
  TokenListRoute,
  UserListRoute,
  useRoute,
  UserRoleListRoute
} from './route'

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
const NavItemLink = routeLink(Nav.Item as ComponentType<NavProps & LinkHOCCompatibleProps>)
const DropdownItemLink = routeLink(
  Dropdown.Item as ComponentType<DropdownProps & LinkHOCCompatibleProps>
)

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
          appearance="default"
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
                icon={<Icon size="lg" icon={isExpanded ? 'angle-left' : 'angle-right'} />}
              />

              <Nav>
                <NavItemLink
                  icon={<Icon icon="file-text" />}
                  route={ArticleListRoute.create({})}
                  active={
                    current?.type === RouteType.ArticleList || current?.type === RouteType.Index
                  }>
                  {t('navbar.articles')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="file-text-o" />}
                  route={PeerArticleListRoute.create({})}
                  active={current?.type === RouteType.PeerArticleList}>
                  {t('navbar.peerArticles')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="frame" />}
                  route={PageListRoute.create({})}
                  active={current?.type === RouteType.PageList}>
                  {t('navbar.pages')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="comment" />}
                  route={CommentListRoute.create({})}
                  active={current?.type === RouteType.CommentList}>
                  {t('navbar.comments')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="image" />}
                  route={ImageListRoute.create({})}
                  active={current?.type === RouteType.ImageList}>
                  {t('navbar.imageLibrary')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="bars" />}
                  route={NavigationListRoute.create({})}
                  active={current?.type === RouteType.NavigationList}>
                  {t('navbar.navigations')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="people-group" />}
                  route={AuthorListRoute.create({})}
                  active={current?.type === RouteType.AuthorList}>
                  {t('navbar.authors')}
                </NavItemLink>

                <Dropdown
                  eventKey={'1'}
                  title={t('navbar.usersAndMembers')}
                  icon={<Icon icon="peoples" />}>
                  <DropdownItemLink
                    active={current?.type === RouteType.UserList}
                    icon={<Icon icon="user-circle" />}
                    route={UserListRoute.create({})}>
                    {t('navbar.users')}
                  </DropdownItemLink>

                  <DropdownItemLink
                    active={current?.type === RouteType.UserRoleList}
                    icon={<Icon icon="character-authorize" />}
                    route={UserRoleListRoute.create({})}>
                    {t('navbar.userRoles')}
                  </DropdownItemLink>

                  <DropdownItemLink
                    active={current?.type === RouteType.SubscriptionList}
                    icon={<Icon icon="meh-o" />}
                    route={SubscriptionListRoute.create({})}>
                    {t('navbar.subscriptions')}
                  </DropdownItemLink>

                  <DropdownItemLink
                    active={current?.type === RouteType.MemberPlanList}
                    icon={<Icon icon="id-card" />}
                    route={MemberPlanListRoute.create({})}>
                    {t('navbar.memberPlans')}
                  </DropdownItemLink>

                  <DropdownItemLink
                    active={current?.type === RouteType.PaymentMethodList}
                    icon={<Icon icon="credit-card" />}
                    route={PaymentMethodListRoute.create({})}>
                    {t('navbar.paymentMethods')}
                  </DropdownItemLink>
                </Dropdown>

                <Dropdown title={t('navbar.peering')} icon={<Icon icon="share" />}>
                  <DropdownItemLink
                    active={current?.type === RouteType.PeerList}
                    icon={<Icon icon="share" />}
                    route={PeerListRoute.create({})}>
                    {t('navbar.peers')}
                  </DropdownItemLink>
                  <DropdownItemLink
                    active={current?.type === RouteType.TokenList}
                    icon={<Icon icon="key" />}
                    route={TokenListRoute.create({})}>
                    {t('navbar.tokens')}
                  </DropdownItemLink>
                </Dropdown>
              </Nav>
            </Sidenav.Body>
          </Sidenav>
          <Navbar appearance="default" className="nav-toggle">
            <Navbar.Body>
              <Nav>
                <Dropdown
                  placement="topStart"
                  trigger="click"
                  renderTitle={children => {
                    return <Icon style={iconStyles} icon="cog" className="icon-selector" />
                  }}>
                  <DropdownItemLink route={LogoutRoute.create({})}>
                    {t('navbar.logout')}
                  </DropdownItemLink>
                </Dropdown>
              </Nav>
              <Nav>
                <Dropdown
                  placement="topStart"
                  trigger="click"
                  renderTitle={() => (
                    <Icon
                      className="icon-selector"
                      icon="globe"
                      style={{
                        width: 56,
                        height: 56,
                        lineHeight: '56px',
                        textAlign: 'center'
                      }}
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
            </Navbar.Body>
          </Navbar>
        </Sidebar>
        <Container
          style={{
            paddingTop: '60px',
            paddingBottom: '60px',
            paddingLeft: '40px',
            paddingRight: '40px'
          }}>
          {children}
        </Container>
      </Container>
    </div>
  )
}
