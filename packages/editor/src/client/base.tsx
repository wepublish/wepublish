import AngleLeftIcon from '@rsuite/icons/legacy/AngleLeft'
import AngleRightIcon from '@rsuite/icons/legacy/AngleRight'
import BarsIcon from '@rsuite/icons/legacy/Bars'
import CharacterAuthorizeIcon from '@rsuite/icons/legacy/CharacterAuthorize'
import CogIcon from '@rsuite/icons/legacy/Cog'
import CommentIcon from '@rsuite/icons/legacy/Comment'
import CreditCardIcon from '@rsuite/icons/legacy/CreditCard'
import FileTextIcon from '@rsuite/icons/legacy/FileText'
import FileTextOIcon from '@rsuite/icons/legacy/FileTextO'
import FrameIcon from '@rsuite/icons/legacy/Frame'
import GlobeIcon from '@rsuite/icons/legacy/Globe'
import IdCardIcon from '@rsuite/icons/legacy/IdCard'
import ImageIcon from '@rsuite/icons/legacy/Image'
import KeyIcon from '@rsuite/icons/legacy/Key'
import MehOIcon from '@rsuite/icons/legacy/MehO'
import PeopleGroupIcon from '@rsuite/icons/legacy/PeopleGroup'
import PeoplesIcon from '@rsuite/icons/legacy/Peoples'
import ShareIcon from '@rsuite/icons/legacy/Share'
import UserCircleIcon from '@rsuite/icons/legacy/UserCircle'
import TagIcon from '@rsuite/icons/Tag'
import React, {ReactNode, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Link, useLocation} from 'react-router-dom'
import {Container, IconButton, Nav, Navbar, Sidebar, Sidenav} from 'rsuite'

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
                <Nav.Item
                  as={NavLink}
                  href="/articles"
                  icon={<FileTextIcon />}
                  active={path === 'articles'}>
                  {t('navbar.articles')}
                </Nav.Item>

                <Nav.Item
                  as={NavLink}
                  href="/peerarticles"
                  icon={<FileTextOIcon />}
                  active={path === 'peerarticles'}>
                  {t('navbar.peerArticles')}
                </Nav.Item>

                <Nav.Item as={NavLink} href="/pages" icon={<FrameIcon />} active={path === 'pages'}>
                  {t('navbar.pages')}
                </Nav.Item>

                <Nav.Menu eventKey={'1'} title={t('navbar.comments')} icon={<CommentIcon />}>
                  <Nav.Item
                    as={NavLink}
                    href="/comments"
                    icon={<CommentIcon />}
                    active={path === 'comments'}>
                    {t('navbar.comments')}
                  </Nav.Item>

                  <Nav.Item
                    as={NavLink}
                    href="/comments/tags"
                    icon={<TagIcon />}
                    active={path === 'comments/tags'}>
                    {t('navbar.commentTags')}
                  </Nav.Item>
                </Nav.Menu>

                <Nav.Item
                  as={NavLink}
                  href="/images"
                  icon={<ImageIcon />}
                  active={path === 'images'}>
                  {t('navbar.imageLibrary')}
                </Nav.Item>

                <Nav.Item
                  as={NavLink}
                  href="/navigations"
                  icon={<BarsIcon />}
                  active={path === 'navigations'}>
                  {t('navbar.navigations')}
                </Nav.Item>

                <Nav.Item
                  as={NavLink}
                  href="/authors"
                  icon={<PeopleGroupIcon />}
                  active={path === 'authors'}>
                  {t('navbar.authors')}
                </Nav.Item>

                <Nav.Menu eventKey={'1'} title={t('navbar.usersAndMembers')} icon={<PeoplesIcon />}>
                  <Nav.Item
                    as={NavLink}
                    href="/users"
                    active={path === 'users'}
                    icon={<UserCircleIcon />}>
                    {t('navbar.users')}
                  </Nav.Item>

                  <Nav.Item
                    as={NavLink}
                    href="/userroles"
                    active={path === 'userroles'}
                    icon={<CharacterAuthorizeIcon />}>
                    {t('navbar.userRoles')}
                  </Nav.Item>

                  <Nav.Item
                    as={NavLink}
                    href="/subscriptions"
                    active={path === 'subscriptions'}
                    icon={<MehOIcon />}>
                    {t('navbar.subscriptions')}
                  </Nav.Item>

                  <Nav.Item
                    as={NavLink}
                    href="/memberplans"
                    active={path === 'memberplans'}
                    icon={<IdCardIcon />}>
                    {t('navbar.memberPlans')}
                  </Nav.Item>

                  <Nav.Item
                    as={NavLink}
                    href="/paymentmethods"
                    active={path === 'paymentmethods'}
                    icon={<CreditCardIcon />}>
                    {t('navbar.paymentMethods')}
                  </Nav.Item>
                </Nav.Menu>

                <Nav.Menu title={t('navbar.peering')} icon={<ShareIcon />}>
                  <Nav.Item
                    as={NavLink}
                    href="/peering"
                    active={path === 'peering'}
                    icon={<ShareIcon />}>
                    {t('navbar.peers')}
                  </Nav.Item>
                  <Nav.Item
                    as={NavLink}
                    href="/tokens"
                    active={path === 'tokens'}
                    icon={<KeyIcon />}>
                    {t('navbar.tokens')}
                  </Nav.Item>
                </Nav.Menu>

                <Nav.Item
                  as={NavLink}
                  href="/settings"
                  active={path === 'settings'}
                  icon={<CogIcon />}>
                  {t('navbar.settings')}
                </Nav.Item>
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
                    icon={<BarsIcon />}
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
                    icon={<GlobeIcon />}
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
