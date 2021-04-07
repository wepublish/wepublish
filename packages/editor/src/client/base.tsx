import React, {ReactNode, useEffect, useState} from 'react'

import {Container, Sidebar, Sidenav, Nav, Navbar, Icon, IconButton, Dropdown} from 'rsuite'

import {
  ArticleListRoute,
  CommentListRoute,
  useRoute,
  RouteType,
  PageListRoute,
  routeLink,
  AuthorListRoute,
  ImageListRoute,
  UserListRoute,
  UserRoleListRoute,
  PeerListRoute,
  TokenListRoute,
  MemberPlanListRoute,
  PaymentMethodListRoute,
  NavigationListRoute,
  LogoutRoute,
  ContentListRoute,
  ExtensionRoute
} from './route'

import {useTranslation} from 'react-i18next'
import {EditorConfig} from './interfaces/extensionConfig'

export interface BaseProps {
  children?: ReactNode
  readonly contentTypeList: EditorConfig
}

const AVAILABLE_LANG = [
  {id: 'en', lang: 'en_US', name: 'English'}
  /* {id: 'fr', lang: 'fr_FR', name: 'Français'},
  {id: 'de', lang: 'de_CH', name: 'Deutsch'} */
]

const headerStyles = {
  height: 60,
  paddingLeft: 10,
  display: 'flex',
  alignItems: 'center'
}

const settingsStyles = {
  marginLeft: 10
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const NavItemLink = routeLink(Nav.Item)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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

export function Base({children, contentTypeList}: BaseProps) {
  const {current} = useRoute()

  const {t, i18n} = useTranslation()

  const [isExpanded, setIsExpanded] = useState(true)

  const [uiLanguage, setUILanguage] = useStickyState(AVAILABLE_LANG[0].id, 'wepublish/language')

  let customContentNavItems: any = []
  if (contentTypeList) {
    customContentNavItems = contentTypeList.contentModelExtension.map(item => {
      const route = ContentListRoute.create({type: item.identifier})
      return (
        <NavItemLink
          key={item.identifier}
          icon={<Icon icon="file" />}
          route={route}
          active={
            current?.type === RouteType.ContentList && current.params.type === item.identifier
          }>
          {item.namePlural}
        </NavItemLink>
      )
    })

    contentTypeList.cusomExtension?.forEach(item => {
      const route = ExtensionRoute.create({type: item.identifier})
      customContentNavItems.push(
        <NavItemLink
          key={item.identifier}
          icon={<Icon icon="file" />}
          route={route}
          active={
            current?.type === RouteType.ContentList && current.params.type === item.identifier
          }>
          {item.namePlural}
        </NavItemLink>
      )
    })
  }

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
          <Sidenav expanded={isExpanded} defaultOpenKeys={['1']} style={{flex: '1 1 auto'}}>
            <Sidenav.Header>
              <div style={headerStyles}>
                <IconButton
                  onClick={() => setIsExpanded(!isExpanded)}
                  icon={<Icon icon={isExpanded ? 'angle-left' : 'angle-right'} />}
                  circle
                  size="md"
                />
              </div>
            </Sidenav.Header>
            <Sidenav.Body>
              <Nav>
                <NavItemLink
                  icon={<Icon icon="file-text" />}
                  route={ArticleListRoute.create({})}
                  active={current?.type === RouteType.ArticleList}>
                  {t('navbar.articles')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="file" />}
                  route={PageListRoute.create({})}
                  active={current?.type === RouteType.PageList}>
                  {t('navbar.pages')}
                </NavItemLink>

                {customContentNavItems}

                <NavItemLink
                  icon={<Icon icon="people-group" />}
                  route={AuthorListRoute.create({})}
                  active={current?.type === RouteType.AuthorList}>
                  {t('navbar.authors')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="comment" />}
                  route={CommentListRoute.create({})}
                  active={current?.type === RouteType.CommentList}>
                  {t('navbar.comments')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="camera-retro" />}
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

                <Dropdown
                  eventKey={'1'}
                  placement="rightStart"
                  title={t('navbar.usersAndMembers')}
                  icon={<Icon icon="peoples" />}>
                  <DropdownItemLink
                    active={current?.type === RouteType.UserList}
                    //icon={<Icon icon="user-circle" />}
                    route={UserListRoute.create({})}>
                    {t('navbar.users')}
                  </DropdownItemLink>

                  <DropdownItemLink
                    active={current?.type === RouteType.UserRoleList}
                    //icon={<Icon icon="character-authorize" />}
                    route={UserRoleListRoute.create({})}>
                    {t('navbar.userRoles')}
                  </DropdownItemLink>

                  <DropdownItemLink
                    active={current?.type === RouteType.MemberPlanList}
                    //icon={<Icon icon="id-card" />}
                    route={MemberPlanListRoute.create({})}>
                    {t('navbar.memberPlans')}
                  </DropdownItemLink>

                  <DropdownItemLink
                    active={current?.type === RouteType.PaymentMethodList}
                    //icon={<Icon icon="money" />}
                    route={PaymentMethodListRoute.create({})}>
                    {t('navbar.paymentMethods')}
                  </DropdownItemLink>
                </Dropdown>

                <NavItemLink
                  icon={<Icon icon="share" />}
                  route={PeerListRoute.create({})}
                  active={current?.type === RouteType.PeerList}>
                  {t('navbar.peering')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="key" />}
                  route={TokenListRoute.create({})}
                  active={current?.type === RouteType.TokenList}>
                  {t('navbar.tokens')}
                </NavItemLink>
              </Nav>
            </Sidenav.Body>
          </Sidenav>

          <Navbar className="settings">
            <Navbar.Body>
              <Nav style={settingsStyles}>
                <Dropdown
                  placement="topStart"
                  renderTitle={() => {
                    return <IconButton appearance="ghost" icon={<Icon icon="cog" />} circle />
                  }}>
                  <Dropdown.Menu icon={<Icon icon="globe" />} title={t('navbar.language')}>
                    {AVAILABLE_LANG.map(lang => (
                      <Dropdown.Item
                        key={lang.id}
                        onSelect={() => setUILanguage(lang.id)}
                        active={lang.id === uiLanguage}>
                        {lang.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                  <DropdownItemLink route={LogoutRoute.create({})} icon={<Icon icon="sign-out" />}>
                    {t('navbar.logout')}
                  </DropdownItemLink>
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
