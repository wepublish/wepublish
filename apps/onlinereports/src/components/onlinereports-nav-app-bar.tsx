import {
  BuilderNavAppBarProps,
  HomeLogoButton,
  LoggedInButtons,
  LoggedOutButtons,
  MenuItems,
  NavbarLinks,
  NavbarMain,
  NavbarOpenCloseButton
} from '@wepublish/website'
import {AppBar, Box, Container, css, styled} from '@mui/material'

export const OnlineReportsNavAppBar = ({
  logo,
  loginUrl,
  profileUrl,
  subscriptionsUrl,
  headerItems,
  menuToggle,
  actions
}: BuilderNavAppBarProps) => {
  return (
    <AppBar position="static" elevation={0} color={'transparent'}>
      <Container maxWidth="lg">
        <NavbarInnerWrapper>
          <OnlineReportsHomeLogoButton logo={logo} menuToggle={menuToggle} />
          <NavbarMain>
            {!!headerItems?.links.length && (
              <NavbarLinks isMenuOpen={menuToggle.value}>
                <MenuItems items={headerItems} />
              </NavbarLinks>
            )}
          </NavbarMain>

          <NavbarActions>
            {actions}
            <LoggedInButtons profileUrl={profileUrl} subscriptionsUrl={subscriptionsUrl} />
            <LoggedOutButtons loginUrl={loginUrl} />
            <NavbarOpenCloseButton toggle={menuToggle} />
          </NavbarActions>
        </NavbarInnerWrapper>
      </Container>
    </AppBar>
  )
}

const OnlineReportsHomeLogoButton = styled(HomeLogoButton)`
  //margin: -${({theme}) => theme.spacing(2)} 0;
`

export const NavbarActions = styled(Box)`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-self: end;
  gap: ${({theme}) => theme.spacing(1)};
  margin: -${({theme}) => theme.spacing(1.5)};
`

export const NavbarInnerWrapper = styled('div')`
  width: 100%;
  max-width: ${({theme}) => theme.breakpoints.values.lg}px;
  margin-left: auto;
  margin-right: auto;
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};
  grid-auto-flow: column;
  justify-items: center;
  min-height: ${({theme}) => theme.spacing(10)};
  align-items: center;
  grid-template-columns: auto 1fr auto;

  padding-top: ${({theme}) => theme.spacing(1.5)};
  padding-bottom: ${({theme}) => theme.spacing(1.5)};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      min-height: 120px;
    }

    ${theme.breakpoints.up('md')} {
      padding-left: ${theme.spacing(7)};
      padding-right: ${theme.spacing(7)};
      padding-top: ${theme.spacing(5)};
      padding-bottom: ${theme.spacing(5)};
    }
  `}
`
