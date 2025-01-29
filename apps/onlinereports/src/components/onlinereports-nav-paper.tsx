import {Box, css, IconButton, styled} from '@mui/material'
import {BuilderNavPaperProps, navigationLinkToUrl, useWebsiteBuilder} from '@wepublish/website'
import {TextToIcon} from '@wepublish/ui'
import {MdClose, MdSearch} from 'react-icons/md'

const NavPaperOverlay = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-auto-flow: column;
  grid-template-areas: 'menu';
  grid-template-columns: 1fr;

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-template-areas: 'semiTransparentCover semiTransparentCover menu cover';
    grid-template-columns: 1fr minmax(auto, ${({theme}) => theme.breakpoints.values.lg - 450}px) 450px 1fr;
  }
`

const NavPaperWrapper = styled('div')`
  padding: ${({theme}) => theme.spacing(2.5)};
  background-color: ${({theme}) => theme.palette.primary.main};
  color: ${({theme}) => theme.palette.primary.contrastText};
  gap: ${({theme}) => theme.spacing(3)};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100vh;
  max-width: 100%;
  //max-width: 100%;
  padding-top: ${({theme}) => theme.spacing(5)};
  padding-bottom: ${({theme}) => theme.spacing(5)};
  ${({theme}) => theme.breakpoints.up('md')} {
    padding-left: ${({theme}) => theme.spacing(10)};
    padding-right: ${({theme}) => theme.spacing(10)};
  }
  grid-area: menu;
`

export const NavPaperCategory = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-auto-rows: max-content;
`
export const NavPaperChildrenWrapper = styled('div')`
  position: relative;
  padding: ${({theme}) => theme.spacing(1.5)};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  justify-items: center;
  width: 100%;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      position: absolute;
      grid-template-columns: auto;
      justify-items: start;
      width: calc(100% / 6);
      gap: ${theme.spacing(3)};
      padding-top: ${theme.spacing(10)};
      padding-left: ${theme.spacing(2)};
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
      <SemiTransparentCover />
      <NavPaperWrapper>
        <Box display={'flex'} justifyContent={'space-between'} margin={-1.5}>
          <IconButton size="large" aria-label="Menu" color={'inherit'}>
            <MdSearch />
          </IconButton>
          <IconButton size="large" aria-label="Menu" onClick={closeMenu} color={'inherit'}>
            <MdClose />
          </IconButton>
        </Box>
        {children && <NavPaperChildrenWrapper>{children}</NavPaperChildrenWrapper>}

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
      </NavPaperWrapper>
      {/*</NavPaperPositioner>*/}
      <Cover />
    </NavPaperOverlay>
  )
}

const Cover = styled('div')`
  background-color: ${({theme}) => theme.palette.primary.main};
  grid-area: cover;
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
