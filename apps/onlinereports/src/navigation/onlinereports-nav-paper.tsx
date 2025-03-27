import {css, IconButton, useTheme} from '@mui/material'
import {TextToIcon, useToggle} from '@wepublish/ui'
import {MdClose, MdExpandLess, MdExpandMore, MdSearch} from 'react-icons/md'
import {NavbarActions, NavbarInnerWrapper, NavStructure} from './onlinereports-nav-app-bar'
import {navigationLinkToUrl} from '@wepublish/navigation/website'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import styled from '@emotion/styled'
import {BuilderNavPaperProps, navPaperLinkStyling} from './nav-paper'
import {FullNavigationFragment} from '@wepublish/website/api'

const NavPaperOverlay = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-columns: 1fr minmax(auto, 794px) 520px 1fr;
  grid-template-areas: 'semiTransparentCover semiTransparentCover menu cover';
  overflow: hidden;

  ${({theme}) => theme.breakpoints.down('sm')} {
    grid-template-areas: 'menu menu menu';
    grid-template-columns: 1fr auto 1fr;
  }
`

const NavPaperWrapper = styled('div')`
  background-color: ${({theme}) => theme.palette.secondary.main};
  color: ${({theme}) => theme.palette.secondary.contrastText};
  gap: ${({theme}) => theme.spacing(3)};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100vh;
  max-width: 100%;

  grid-area: menu;
`

export const NavPaperCategory = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-auto-rows: max-content;
`
export const NavPaperChildrenWrapper = styled(NavStructure)`
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  justify-items: center;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      position: absolute;
      grid-template-columns: auto;
      justify-items: start;
      width: calc(100% / 6);
      gap: ${theme.spacing(3)};
      padding-top: ${theme.spacing(10)};
    }
  `}
`

type OnlineReportsNavCategoryProps = {
  navigation: FullNavigationFragment
  closeMenu: () => void
}

export const NavigationCategory = ({navigation: nav, closeMenu}: OnlineReportsNavCategoryProps) => {
  const {
    elements: {Link, H6}
  } = useWebsiteBuilder()
  const theme = useTheme()
  const subItemsToggle = useToggle()

  return (
    <NavigationCategoryWrapper>
      <NavigationTopItem onClick={subItemsToggle.toggle}>
        {nav.name} {subItemsToggle.value ? <MdExpandLess /> : <MdExpandMore />}{' '}
      </NavigationTopItem>
      {subItemsToggle.value && (
        <NavigationCategorySubItems>
          {nav.links?.map((link, index) => {
            const url = navigationLinkToUrl(link)
            return (
              <Link
                href={url}
                key={index}
                color="inherit"
                underline="none"
                css={navPaperLinkStyling(theme)}
                onClick={closeMenu}>
                <NavigationSubItem>{link.label}</NavigationSubItem>
              </Link>
            )
          })}
        </NavigationCategorySubItems>
      )}
    </NavigationCategoryWrapper>
  )
}

export const OnlineReportsNavPaper = ({
  main,
  categories,
  loginBtn,
  profileBtn,
  subscribeBtn,
  closeMenu,
  children,
  iconItems
}: BuilderNavPaperProps) => {
  const {
    elements: {Link, Button, H4, H6}
  } = useWebsiteBuilder()
  const theme = useTheme()

  return (
    <NavPaperOverlay>
      <SemiTransparentCover />
      {/*<NavPaperPositioner>*/}
      <NavPaperWrapper>
        <NavStructure>
          <NavbarInnerWrapper>
            <NavbarActions>
              <Link href="/search" color="inherit" onClick={closeMenu}>
                <IconButton size="large" aria-label="Menu" color={'inherit'}>
                  <MdSearch />
                </IconButton>
              </Link>
            </NavbarActions>
            <div></div>
            <NavbarActions>
              <IconButton size="large" aria-label="Menu" onClick={closeMenu} color={'inherit'}>
                <MdClose />
              </IconButton>
            </NavbarActions>
          </NavbarInnerWrapper>

          <NavigationWrapper>
            {!!categories.length &&
              categories
                .flat()
                .map(nav => (
                  <NavigationCategory key={nav.id} navigation={nav} closeMenu={closeMenu} />
                ))}
            {main?.links.map((link, index) => {
              const url = navigationLinkToUrl(link)
              return (
                <Link key={index} href={url} color="inherit">
                  <NavigationTopItem onClick={closeMenu}>{link.label}</NavigationTopItem>
                </Link>
              )
            })}
          </NavigationWrapper>

          <IconsWrapper>
            {iconItems?.links.map(link => {
              const url = navigationLinkToUrl(link)

              return (
                <Link href={url} color="inherit">
                  <TextToIcon title={link.label} size={32} />
                </Link>
              )
            })}
          </IconsWrapper>
        </NavStructure>
      </NavPaperWrapper>
      {/*</NavPaperPositioner>*/}
      <Cover />
    </NavPaperOverlay>
  )
}

const Cover = styled('div')`
  background-color: ${({theme}) => theme.palette.secondary.main};
  grid-area: cover;
  height: 100%;
`

const SemiTransparentCover = styled(Cover)`
  opacity: 0.6;
  background-color: #70787e;
  grid-area: semiTransparentCover;
`

const NavigationWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.spacing(2)};
`

const NavigationCategoryWrapper = styled('span')`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.spacing(1)};
`

const NavigationTopItem = styled('span')`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-weight: 500;
  font-size: 28px;
  line-height: 1.2em;
  align-content: end;

  cursor: pointer;
  user-select: none;
`

const NavigationCategorySubItems = styled('span')`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.spacing(1.5)};
  padding-top: ${({theme}) => theme.spacing(1)};
  padding-bottom: ${({theme}) => theme.spacing(2)};
`

const NavigationSubItem = styled('span')`
  display: block;
  font-weight: 300;
  font-size: 24px;
  line-height: 1.2em;
`
const IconsWrapper = styled('div')``
