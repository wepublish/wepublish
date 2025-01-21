import styled from '@emotion/styled'
import {SxProps, Theme} from '@mui/material'
import {
  ApiV1,
  Navbar,
  NavbarActions,
  NavbarInnerWrapper,
  useUser,
  useWebsiteBuilder
} from '@wepublish/website'

export const TsriNavbar = styled(Navbar)`
  ${NavbarInnerWrapper} {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: ${({theme}) => theme.breakpoints.values.lg}px;

    ${({theme}) => theme.breakpoints.up('lg')} {
      padding-left: ${({theme}) => theme.spacing(3)};
      padding-right: ${({theme}) => theme.spacing(3)};
    }
  }

  ${NavbarActions} {
    .MuiIconButton-root {
      display: none;
    }
  }
`

const buttonStyles: SxProps<Theme> = theme => ({
  [theme.breakpoints.up('sm')]: {
    fontSize: '1.1em',
    padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`
  }
})

export const MitmachenButton = () => {
  const {
    elements: {Button, Link}
  } = useWebsiteBuilder()
  const {hasUser} = useUser()
  const {data: subscriptions} = ApiV1.useSubscriptionsQuery({
    skip: !hasUser
  })

  const hasSubscription = subscriptions?.subscriptions.some(
    subscription => !subscription.deactivation
  )

  return (
    !hasSubscription && (
      <Button LinkComponent={Link} href="/mitmachen" size="small" sx={buttonStyles}>
        Member werden
      </Button>
    )
  )
}
