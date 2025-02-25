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
import {Structure} from '../structure'

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
      <Structure>
        <MenuContainer>
          <NavStructure>
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
          </NavStructure>
        </MenuContainer>
      </Structure>
    </AppBar>
  )
}

const MenuContainer = styled('div')`
  grid-column: 2/4;

  @media (max-width: 1200px) {
    grid-column: 2/3;
  }
`

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

export const NavStructure = styled('div')`
  width: 100%;
  max-width: ${({theme}) => theme.breakpoints.values.lg}px;
  margin-left: auto;
  margin-right: auto;

  padding: ${({theme}) => theme.spacing(3)};
  padding-top: ${({theme}) => theme.spacing(1.5)};
  padding-bottom: ${({theme}) => theme.spacing(1.5)};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      min-height: 120px;
    }

    ${theme.breakpoints.up('md')} {
      padding-left: ${theme.spacing(5)};
      padding-right: ${theme.spacing(5)};
      padding-top: ${theme.spacing(5)};
      padding-bottom: ${theme.spacing(5)};
    }
  `}
`

export const NavbarInnerWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-auto-flow: column;
  justify-items: center;
  min-height: ${({theme}) => theme.spacing(10)};
  align-items: center;
  grid-template-columns: auto 1fr auto;
`
