import styled from '@emotion/styled'
import {css, GlobalStyles} from '@mui/material'
import {FullPaywallFragment} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {useIntersectionObserver} from 'usehooks-ts'
import {BannerWrapper} from '@wepublish/banner/website'

type BuilderPaywallProps = {className?: string} & FullPaywallFragment

export const PaywallWrapper = styled.div`
  display: grid !important; // exception as it should always be shown
  gap: ${({theme}) => theme.spacing(5)};
  justify-content: center;
  align-items: center;
  background-color: ${({theme}) => theme.palette.accent.light};
  color: ${({theme}) => theme.palette.accent.contrastText};
  padding: ${({theme}) => theme.spacing(4)};
`

const PaywallActions = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: ${({theme}) => theme.spacing(3)};
  row-gap: ${({theme}) => theme.spacing(2)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-template-columns: max-content max-content;
  }
`

const hideBanner = (
  <GlobalStyles
    styles={css`
      ${BannerWrapper} {
        display: none !important;
      }
    `}
  />
)

export const Paywall = ({className, description}: BuilderPaywallProps) => {
  const {
    elements: {Button, Link},
    blocks: {RichText}
  } = useWebsiteBuilder()
  const {isIntersecting, ref} = useIntersectionObserver({
    initialIsIntersecting: false
  })

  return (
    <PaywallWrapper className={className} ref={ref}>
      <RichText richText={description ?? []} />

      <PaywallActions>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          LinkComponent={Link}
          href={'/mitmachen'}>
          Abonnent*in werden
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          size="large"
          LinkComponent={Link}
          href={'/login'}>
          Login
        </Button>
      </PaywallActions>

      {isIntersecting && hideBanner}
    </PaywallWrapper>
  )
}
