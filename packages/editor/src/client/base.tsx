import React, {ReactNode, useEffect, useState} from 'react'

import {Container, Sidebar, Sidenav, Nav, Navbar, Icon, Dropdown} from 'rsuite'

import {
  ArticleListRoute,
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
  LogoutRoute
} from './route'

import {useTranslation} from 'react-i18next'

export interface BaseProps {
  children?: ReactNode
}

const iconStyles = {
  width: 56,
  height: 56,
  lineHeight: '56px',
  textAlign: 'center'
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const NavItemLink = routeLink(Nav.Item)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const DropdownItemLink = routeLink(Dropdown.Item)

export function Base({children}: BaseProps) {
  const {current} = useRoute()

  const {t} = useTranslation()

  const [isExpanded, setIsExpanded] = useState(true)

  const [isUsersAndMembersOpen, setUsersAndMembersOpen] = useState(true)

  useEffect(() => {
    const shouldBeOpen =
      current?.type === RouteType.UserList ||
      current?.type === RouteType.UserRoleList ||
      current?.type === RouteType.MemberPlanList ||
      current?.type === RouteType.PaymentMethodList
    console.log({shouldBeOpen})
    setUsersAndMembersOpen(shouldBeOpen)
  }, [current?.type])

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
            appearance="subtle"
            style={{flex: '1 1 auto'}}>
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

                <NavItemLink
                  icon={<Icon icon="people-group" />}
                  route={AuthorListRoute.create({})}
                  active={current?.type === RouteType.AuthorList}>
                  {t('navbar.authors')}
                </NavItemLink>

                <NavItemLink
                  icon={<Icon icon="camera-retro" />}
                  route={ImageListRoute.create({})}
                  active={current?.type === RouteType.ImageList}>
                  {t('navbar.imageLibrary')}
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
                    active={current?.type === RouteType.MemberPlanList}
                    icon={<Icon icon="id-card" />}
                    route={MemberPlanListRoute.create({})}>
                    {t('navbar.memberPlans')}
                  </DropdownItemLink>

                  <DropdownItemLink
                    active={current?.type === RouteType.PaymentMethodList}
                    icon={<Icon icon="money" />}
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
          <Navbar appearance="subtle" className="nav-toggle">
            <Navbar.Body>
              <Nav>
                <Dropdown
                  placement="topStart"
                  trigger="click"
                  renderTitle={children => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    return <Icon style={iconStyles} icon="cog" />
                  }}>
                  <DropdownItemLink route={LogoutRoute.create({})}>
                    {t('navbar.logout')}
                  </DropdownItemLink>
                  <Dropdown.Item></Dropdown.Item>
                </Dropdown>
              </Nav>

              <Nav pullRight>
                <Nav.Item
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{width: 56, textAlign: 'center'}}>
                  <Icon icon={isExpanded ? 'angle-left' : 'angle-right'} />
                </Nav.Item>
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
