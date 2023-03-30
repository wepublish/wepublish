import styled from '@emotion/styled'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import {BuilderNavbarProps, useWebsiteBuilder} from '@wepublish/website/builder'

const NavbarWrapper = styled(Box)`
  flex-grow: 1;
`

const Title = styled.div`
  flex-grow: 1;
`

export type NavbarProps = BuilderNavbarProps

export function Navbar({className, data, loading, error}: NavbarProps) {
  const {
    elements: {Button}
  } = useWebsiteBuilder()

  return (
    <NavbarWrapper className={className}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Title}>
            Newsroom
          </Typography>

          <Button>Login</Button>
        </Toolbar>
      </AppBar>
    </NavbarWrapper>
  )
}
