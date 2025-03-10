import {css, IconButton, styled} from '@mui/material'
import {BuilderNavPaperProps, navigationLinkToUrl, useWebsiteBuilder} from '@wepublish/website'
import {TextToIcon} from '@wepublish/ui'
import {MdClose, MdSearch} from 'react-icons/md'
import {NavbarActions, NavbarInnerWrapper, NavStructure} from './onlinereports-nav-app-bar'

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

export const OnlineReportsNavPaper = ({
  main,
  categories,
  loginUrl,
  profileUrl,
  subscriptionsUrl,
  closeMenu,
  children,
  iconItems
}: BuilderNavPaperProps) => {
  const {
    elements: {Link, Button, H4, H6}
  } = useWebsiteBuilder()

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
          {/*{children && <NavPaperChildrenWrapper>{children}</NavPaperChildrenWrapper>}*/}

          {/*<NavPaperMainLinks>*/}
          {/*  {main?.links.map((link, index) => {*/}
          {/*    const url = navigationLinkToUrl(link)*/}

          {/*    return (*/}
          {/*      <Link href={url} key={index} color="inherit" underline="none" onClick={closeMenu}>*/}
          {/*        <H4 component="span" css={{fontWeight: '700'}}>*/}
          {/*          {link.label}*/}
          {/*        </H4>*/}
          {/*      </Link>*/}
          {/*    )*/}
          {/*  })}*/}

          {/*  <NavPaperActions>*/}
          {/*    {!hasUser && loginUrl && (*/}
          {/*      <Button*/}
          {/*        LinkComponent={Link}*/}
          {/*        href={loginUrl}*/}
          {/*        variant="contained"*/}
          {/*        color="secondary"*/}
          {/*        onClick={closeMenu}>*/}
          {/*        Login*/}
          {/*      </Button>*/}
          {/*    )}*/}

          {/*    {hasUser && (*/}
          {/*      <>*/}
          {/*        {profileUrl && (*/}
          {/*          <Button*/}
          {/*            LinkComponent={Link}*/}
          {/*            href={profileUrl}*/}
          {/*            variant="contained"*/}
          {/*            color="secondary"*/}
          {/*            onClick={closeMenu}>*/}
          {/*            Mein Konto*/}
          {/*          </Button>*/}
          {/*        )}*/}

          {/*        {subscriptionsUrl && (*/}
          {/*          <Button*/}
          {/*            LinkComponent={Link}*/}
          {/*            href={subscriptionsUrl}*/}
          {/*            variant="contained"*/}
          {/*            color="accent"*/}
          {/*            onClick={closeMenu}>*/}
          {/*            Meine Abos*/}
          {/*          </Button>*/}
          {/*        )}*/}

          {/*        {loginUrl && (*/}
          {/*          <Button*/}
          {/*            onClick={() => {*/}
          {/*              logout()*/}
          {/*              closeMenu()*/}
          {/*            }}*/}
          {/*            variant="outlined"*/}
          {/*            color="secondary">*/}
          {/*            Logout*/}
          {/*          </Button>*/}
          {/*        )}*/}
          {/*      </>*/}
          {/*    )}*/}
          {/*  </NavPaperActions>*/}
          {/*</NavPaperMainLinks>*/}

          <ItemsWrapper>
            {!!categories.length &&
              categories.map((categoryArray, arrayIndex) => (
                <>
                  {categoryArray.map(nav => (
                    <NavPaperCategory key={nav.id}>
                      <Item onClick={closeMenu}>{nav.name}</Item>
                      {/*<NavPaperName>{nav.name}</NavPaperName>*/}
                      {/*<H6 component="span" css={{fontWeight: '700'}}>*/}
                      {/*  {nav.name}*/}
                      {/*</H6>*/}
                      {/*<NavPaperCategoryLinks>*/}
                      {/*  {nav.links?.map((link, index) => {*/}
                      {/*    const url = navigationLinkToUrl(link)*/}
                      {/*    return (*/}
                      {/*      <Link*/}
                      {/*        href={url}*/}
                      {/*        key={index}*/}
                      {/*        color="inherit"*/}
                      {/*        underline="none"*/}
                      {/*        css={navPaperLinkStyling(theme)}*/}
                      {/*        onClick={closeMenu}>*/}
                      {/*        <H6 component="span" css={{fontWeight: '700'}}>*/}
                      {/*          {link.label}*/}
                      {/*        </H6>*/}
                      {/*      </Link>*/}
                      {/*    )*/}
                      {/*  })}*/}
                      {/*</NavPaperCategoryLinks>*/}
                    </NavPaperCategory>
                  ))}
                </>
              ))}
          </ItemsWrapper>

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

const Item = styled('span')`
  font-weight: 500;
  font-size: 24px;
  //line-height: 1.2em;
`

const ItemsWrapper = styled('div')``
const IconsWrapper = styled('div')``
