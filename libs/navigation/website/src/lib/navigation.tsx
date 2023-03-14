import styled from '@emotion/styled'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import {BuilderNavigationProps, useWebsiteBuilder} from '@wepublish/website-builder'

const NavigationWrapper = styled(Box)`
  flex-grow: 1;
`

const Title = styled.div`
  flex-grow: 1;
`

export function Navigation({data, loading, error}: BuilderNavigationProps) {
  const {Button} = useWebsiteBuilder()

  return (
    <NavigationWrapper>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Title}>
            Newsroom
          </Typography>

          <Button>Login</Button>
        </Toolbar>
      </AppBar>
    </NavigationWrapper>
  )
}
