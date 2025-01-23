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
import {AppBar, Box, css, styled} from '@mui/material'

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
      <NavbarInnerWrapper>
        <Box my={-2}>
          <HomeLogoButton logo={logo} menuToggle={menuToggle} />
        </Box>
        <NavbarMain>
          {!!headerItems?.links.length && (
            <NavbarLinks isMenuOpen={menuToggle.value}>
              <MenuItems items={headerItems} />
            </NavbarLinks>
          )}
        </NavbarMain>

        <NavbarActions margin={-1.5}>
          {actions}
          <LoggedInButtons profileUrl={profileUrl} subscriptionsUrl={subscriptionsUrl} />
          <LoggedOutButtons loginUrl={loginUrl} />
          <NavbarOpenCloseButton toggle={menuToggle} />
        </NavbarActions>
      </NavbarInnerWrapper>
    </AppBar>
  )
}

export const NavbarActions = styled(Box)`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-self: end;
  gap: ${({theme}) => theme.spacing(1)};
`

export const NavbarInnerWrapper = styled('div')`
  width: 100%;
  max-width: ${({theme}) => theme.breakpoints.values.lg}px;
  margin-left: auto;
  margin-right: auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: ${({theme}) => theme.spacing(5)};
  grid-auto-flow: column;
  justify-items: center;
  min-height: unset;
  padding-top: ${({theme}) => theme.spacing(5)};
  padding-bottom: ${({theme}) => theme.spacing(5)};
  padding-left: ${({theme}) => theme.spacing(10)};
  padding-right: ${({theme}) => theme.spacing(10)};
  align-items: start;

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      //grid-template-columns: 1fr auto 1fr;
      min-height: unset;
    }

    ${theme.breakpoints.up('md')} {
      min-height: unset;
    }
  `}
`
